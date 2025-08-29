# 范围框跟随图片缩放问题修复

## 问题描述

在"图像预处理"模块的"剪裁图片"页面中，当用户调整图片缩放时，范围框没有跟随图片一起缩放，导致：
- 范围框在缩放后的图片上位置不准确
- 范围框大小与图片缩放不匹配
- 用户交互体验不一致

## 问题分析

### 根本原因

1. **坐标系统不一致**：
   - `getMousePos`函数返回的是原始坐标（除以了imageScale）
   - 但在`getResizeHandle`中又乘以了imageScale，导致双重缩放
   - `drawCropArea`函数的依赖项不完整，没有包含`imageScale`

2. **绘制函数依赖问题**：
   - `drawCanvas`的依赖项中缺少`imageScale`
   - 当缩放变化时，画布没有正确重绘

3. **函数分离导致的同步问题**：
   - `drawCropArea`作为独立函数，与`drawCanvas`的依赖管理不同步

## 修复方案

### 1. 修复坐标计算

**修复前**：
```typescript
const getResizeHandle = (pos: { x: number, y: number }, area: CropArea) => {
  const handleSize = 8 / imageScale  // 错误：手柄大小不应该除以缩放
  const x = area.x * imageScale
  const y = area.y * imageScale
  // ...
}
```

**修复后**：
```typescript
const getResizeHandle = (pos: { x: number, y: number }, area: CropArea) => {
  const handleSize = 8  // 固定手柄大小
  const x = area.x * imageScale
  const y = area.y * imageScale
  // ...
}
```

### 2. 内联绘制函数

**修复前**：
```typescript
const drawCanvas = useCallback(() => {
  // ...
  cropAreas.forEach(area => {
    drawCropArea(ctx, area, area.id === selectedAreaId)  // 外部函数调用
  })
}, [cropAreas, selectedAreaId, currentArea])  // 缺少imageScale依赖
```

**修复后**：
```typescript
const drawCanvas = useCallback(() => {
  // ...
  cropAreas.forEach(area => {
    // 内联绘制逻辑，直接使用imageScale
    const x = area.x * imageScale
    const y = area.y * imageScale
    const width = area.width * imageScale
    const height = area.height * imageScale
    // 绘制逻辑...
  })
}, [cropAreas, selectedAreaId, currentArea, imageScale])  // 包含imageScale依赖
```

### 3. 确保缩放响应

**修复前**：
```typescript
// 监听用户缩放比例变化
useEffect(() => {
  // ...
  drawCanvas()  // 可能不会触发重绘
}, [userScale, originalImageScale, drawCanvas])
```

**修复后**：
```typescript
// 监听用户缩放比例变化
useEffect(() => {
  const canvas = canvasRef.current
  const image = imageRef.current
  if (!canvas || !image) return

  const newScale = originalImageScale * userScale
  setImageScale(newScale)
  
  canvas.width = image.naturalWidth * newScale
  canvas.height = image.naturalHeight * newScale
  
  // 重新计算居中偏移
  const containerWidth = canvas.parentElement?.clientWidth || 800
  const offsetX = (containerWidth - canvas.width) / 2
  setImageOffset({ x: Math.max(0, offsetX), y: 0 })
  
  drawCanvas()  // 确保重绘
}, [userScale, originalImageScale, drawCanvas])
```

## 修复效果

### 1. 范围框正确跟随缩放

- ✅ 范围框位置与图片缩放同步
- ✅ 范围框大小与图片缩放比例一致
- ✅ 相对位置保持不变

### 2. 交互体验改善

- ✅ 鼠标悬停检测准确
- ✅ 拖拽和缩放操作精确
- ✅ 视觉反馈及时更新

### 3. 性能优化

- ✅ 减少不必要的函数调用
- ✅ 优化依赖项管理
- ✅ 提高重绘效率

## 技术细节

### 坐标系统

```typescript
// 原始坐标（用于存储和剪裁）
const originalX = area.x
const originalY = area.y

// 显示坐标（用于绘制和交互）
const displayX = originalX * imageScale
const displayY = originalY * imageScale

// 鼠标坐标转换
const mouseOriginalX = (mouseClientX - canvasRect.left) / imageScale
const mouseOriginalY = (mouseClientY - canvasRect.top) / imageScale
```

### 缩放计算

```typescript
// 最终缩放比例
const finalScale = originalImageScale * userScale

// 画布尺寸更新
canvas.width = image.naturalWidth * finalScale
canvas.height = image.naturalHeight * finalScale

// 范围框绘制
const x = area.x * finalScale
const y = area.y * finalScale
const width = area.width * finalScale
const height = area.height * finalScale
```

### 依赖管理

```typescript
// 正确的依赖项
const drawCanvas = useCallback(() => {
  // 绘制逻辑
}, [cropAreas, selectedAreaId, currentArea, imageScale])

// 缩放监听
useEffect(() => {
  // 缩放逻辑
}, [userScale, originalImageScale, drawCanvas])
```

## 测试验证

### 1. 基本缩放测试

- [x] 图片放大时，范围框同步放大
- [x] 图片缩小时，范围框同步缩小
- [x] 范围框相对位置保持不变

### 2. 交互测试

- [x] 缩放后可以正常选中范围框
- [x] 缩放后可以正常拖拽移动
- [x] 缩放后可以正常调整大小

### 3. 边界测试

- [x] 最大缩放（300%）时范围框正常显示
- [x] 最小缩放（30%）时范围框正常显示
- [x] 重置缩放时范围框恢复正常

## 注意事项

1. **坐标精度**：所有剪裁操作仍使用原始坐标，确保精度
2. **性能考虑**：缩放操作会触发画布重绘，对于大图片需要一定时间
3. **内存管理**：高倍缩放会增加内存使用，但范围框坐标存储不受影响
4. **用户体验**：缩放操作流畅，视觉反馈及时

## 总结

通过修复坐标计算、内联绘制函数和优化依赖管理，成功解决了范围框不跟随图片缩放的问题。现在用户可以：

- 自由调整图片缩放，范围框会正确跟随
- 在任何缩放级别下正常操作范围框
- 享受一致和流畅的用户体验

这个修复确保了图片缩放功能的完整性和可靠性。 