graph TD
    A["用户进入剪裁图片界面"] --> B["创建新的剪裁区域"]
    B --> C["拖拽绘制矩形区域"]
    C --> D["区域创建完成"]
    
    D --> E["用户与现有区域交互"]
    E --> F{"用户操作类型"}
    
    F -->|点击区域内部| G["开始拖拽移动"]
    F -->|点击四个角手柄| H["开始缩放调整"]
    F -->|点击空白区域| I["取消选择"]
    
    G --> J["拖拽移动区域"]
    J --> K["实时更新位置"]
    K --> L["鼠标释放完成移动"]
    
    H --> M["拖拽缩放手柄"]
    M --> N["实时更新大小"]
    N --> O["鼠标释放完成缩放"]
    
    I --> P["取消当前选择"]
    
    L --> Q["更新区域数据"]
    O --> Q
    P --> Q
    
    Q --> R["重新绘制画布"]
    R --> S["显示更新后的区域"]
    
    S --> T["用户继续操作或完成"]
    
    G --> G1["鼠标样式变为move"]
    H --> H1["鼠标样式变为nw-resize"]
    I --> I1["鼠标样式变为crosshair"]
    
    style A fill:#e1f5fe
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style E fill:#fff9c4
    style G fill:#e3f2fd
    style H fill:#fce4ec
    style J fill:#e8f5e8
    style M fill:#e8f5e8
    style Q fill:#fff3e0
    style T fill:#fff9c4
