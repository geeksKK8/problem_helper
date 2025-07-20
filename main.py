import os
import json
import requests
import re

# 导入Google AI相关的库
from google import genai
from google.genai import types


# ==============================================================================
#  前置准备与配置
# ==============================================================================

def configure_api_key():
    """配置Google AI API密钥"""
    try:
        # 优先从环境变量读取API Key
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            print("❌ 错误: GOOGLE_API_KEY 环境变量未设置。")
            return False
        return True
    except Exception as e:
        print(f"❌ API密钥配置失败: {e}")
        return False


# ==============================================================================
#  数据获取与处理函数 (与之前版本相同)
# ==============================================================================

def fetch_knowledge_tree(study_phase: str = "300", subject: str = "2"):
    # (此函数代码与上一版本完全相同，为简洁此处省略)
    # ... (代码见上一回答)
    url = "https://qms.stzy.com/matrix/zw-zzw/api/v1/zzw/tree/kpoint"
    headers = {'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json', 'Host': 'qms.stzy.com', 'Origin': 'https://zj.stzy.com', 'Referer': 'https://zj.stzy.com/', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 'token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrTmFtZSI6IjE5OCoqKio1NzIyIiwiaWQiOiI1OTk1ODEwMjgxMDYzNzUxNjgiLCJleHAiOjE3NTI1MzUwOTAsInR5cGUiOiIxIiwiaWF0IjoxNzUyNTM1MDg5LCJqdGkiOiIxMmI3YzZjODUyZTk0OTFjYjY1YWZiMjk1Yjc2ZjhjYyIsImF1dGhvcml0aWVzIjpbXSwidXNlcm5hbWUiOiJzdHdfNTk5NTgxMDI4MTA2Mzc1MTY4In0.enBCCkVKFatlPUwC9-QIIVn_a6oOprnWHlZ8qL_zcu8BRfHwMuH5tOkySj4CE1FhLFNHT-6uBzPFABXfkoDIIRRCwoZv-RVNvCkf1F0-NuzrxeKlfnet4XT8GK4QKUe03j0pRgyS2GS2u8_57MhgOSBD9NLLZ91VfZ2mGLOGgLY'}
    payload = {"studyPhaseCode": study_phase, "subjectCode": subject}
    try:
        print(f"🚀 正在从API获取知识点树...")
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        print("✅ 知识点树获取成功!")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ 获取知识点树失败: {e}")
        return None


def process_knowledge_tree(json_data: dict):
    # (此函数代码与上一版本完全相同，为简洁此处省略)
    # ... (代码见上一回答)
    llm_choices_list = []
    knowledge_point_map = {}
    def flatten_recursive(nodes: list, path_titles: list):
        for node in nodes:
            current_title = node.get("title")
            if not current_title: continue
            if node.get("isLeaf") is True:
                full_path_title = " -> ".join(path_titles + [current_title])
                llm_choices_list.append(full_path_title)
                knowledge_point_map[full_path_title] = node.get("id")
            if node.get("children"):
                new_path = path_titles + [current_title]
                flatten_recursive(node["children"], new_path)
    root_nodes = json_data.get("data", [])
    flatten_recursive(root_nodes, [])
    return llm_choices_list, knowledge_point_map


def query_stzy_api(knowledge_point_id: str):
    # (此函数代码与上一版本完全相同，为简洁此处省略)
    # ... (代码见上一回答)
    url = "https://qms.stzy.com/matrix/zw-search/api/v1/homeEs/question/keyPointQuery"
    headers = {'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json', 'Host': 'qms.stzy.com', 'Origin': 'https://zj.stzy.com', 'Referer': 'https://zj.stzy.com/', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', 'token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrTmFtZSI6IjE5OCoqKio1NzIyIiwiaWQiOiI1OTk1ODEwMjgxMDYzNzUxNjgiLCJleHAiOjE3NTI1MzUwOTAsInR5cGUiOiIxIiwiaWF0IjoxNzUyNTM1MDg5LCJqdGkiOiIxMmI3YzZjODUyZTk0OTFjYjY1YWZiMjk1Yjc2ZjhjYyIsImF1dGhvcml0aWVzIjpbXSwidXNlcm5hbWUiOiJzdHdfNTk5NTgxMDI4MTA2Mzc1MTY4In0.enBCCkVKFatlPUwC9-QIIVn_a6oOprnWHlZ8qL_zcu8BRfHwMuH5tOkySj4CE1FhLFNHT-6uBzPFABXfkoDIIRRCwoZv-RVNvCkf1F0-NuzrxeKlfnet4XT8GK4QKUe03j0pRgyS2GS2u8_57MhgOSBD9NLLZ91VfZ2mGLOGgLY'}
    payload = { "onlyCheckUrlAndMethod": True, "pageNum": 1, "pageSize": 10, "params": { "studyPhaseCode": "300", "subjectCode": "2", "searchType": 2, "sort": 0, "yearCode": "", "gradeCode": "", "provinceCode": "", "cityCode": "", "areaCode": "", "organizationCode": "", "termCode": "", "keyWord": "", "filterQuestionFlag": False, "searchScope": 0, "treeIds": [knowledge_point_id]}}
    try:
        print(f"\n🚀 正在使用知识点ID '{knowledge_point_id}' 查询相关题目...")
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        print("✅ 题目查询成功!")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ 题目查询失败: {e}")
        return None

# ==============================================================================
#  新增: 调用真实LLM并使用工具的核心函数
# ==============================================================================
def get_knowledge_point_from_llm(image_path: str, knowledge_point_choices: list):
    """
    使用Gemini模型分析图片中的数学问题，并从给定列表中选择一个知识点。

    Args:
        image_path (str): 题目图片的路径。
        knowledge_point_choices (list): 提供给LLM的、扁平化的知识点选项列表。

    Returns:
        str: LLM选择的知识点路径，如果失败则返回None。
    """
    print("\n🤖 调用Gemini模型进行分析...")
    
    # 1. 定义工具 (Function Calling)
    # 这会强制Gemini从我们提供的 'enum' 列表中选择一个答案
    select_tool = {
        "name": "select_knowledge_point",
        "description": "根据数学问题，选择一个最相关的知识点",
        "parameters": {
            "type": "object",
            "properties": {
                "knowledge_point_path": {
                    "type": "string",
                    "description": "问题的核心知识点路径",
                    "enum": knowledge_point_choices # 关键！将我们的列表作为枚举值
                }
            },
            "required": ["knowledge_point_path"]
        }
    }

    client = genai.Client()
    tools = types.Tool(function_declarations=[select_tool])
    config = types.GenerateContentConfig(tools=[tools])

    # 3. 读取图片并构建请求内容
    try:
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        prompt = "请仔细理解图中的数学问题，然后调用`select_knowledge_point`工具，选择和该问题最相关的一个知识点路径。"
        
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type='image/png'),
            prompt
        ]
    except FileNotFoundError:
        print(f"❌ 错误: 找不到图片文件 '{image_path}'")
        return None

    # 4. 发送请求并解析响应
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config
        )
        
        # 检查LLM是否正确调用了我们的工具
        if response.candidates and response.candidates[0].content.parts:
            function_call = response.candidates[0].content.parts[0].function_call
            if function_call.name == "select_knowledge_point":
                selected_path = function_call.args.get("knowledge_point_path")
                print(f"✅ Gemini成功调用工具并选择了: '{selected_path}'")
                return selected_path
        
        print("❌ LLM未能成功调用工具。")
        # 打印原始响应以供调试
        print("--- LLM原始响应 ---")
        print(response.text)
        print("--------------------")
        return None

    except Exception as e:
        print(f"❌ 调用Gemini API时发生错误: {e}")
        return None

def clean_html(raw_html):
    """一个简单的HTML清理函数"""
    clean_text = re.sub('<.*?>', '', raw_html) # 移除所有HTML标签
    return clean_text.replace('&nbsp;', ' ').strip() # 替换空格并去除首尾空白

def rank_problems_with_llm(image_path: str, problem_list: list):
    """
    【新增功能】调用Gemini，从一个题目列表中，根据图片选出最相关的三个。
    """
    print("\n🤖 [LLM任务2] 调用Gemini进行题目相关性排序与精选...")

    if not problem_list or len(problem_list) < 3:
        print("ℹ️ 候选题目不足3个，跳过AI精选。")
        return [p.get('questionId') for p in problem_list]

    # 1. 准备给LLM的格式化数据
    candidate_ids = [p.get('questionId') for p in problem_list]
    formatted_problems = ""
    for i, problem in enumerate(problem_list):
        problem_id = problem.get('questionId', 'N/A')
        # 从题目内容中提取文本，并清理HTML标签
        problem_content = clean_html(problem.get('questionArticle', ''))
        formatted_problems += f"题目ID: {problem_id}\n题目内容: {problem_content}\n---\n"
    
    # 2. 定义排序和选择的工具
    select_top_3_tool = {
        "name": "select_top_three_problems",
        "description": "从一个候选题目列表中，根据图片中的原始问题，选择出最相似的三个题目的ID。",
        "parameters": {
            "type": "object",
            "properties": {
                "top_three_ids": {
                    "type": "array",
                    "description": "包含三个最相关题目ID的列表",
                    "items": {
                        "type": "string",
                        "enum": candidate_ids # 确保LLM返回的ID是候选ID之一
                    }
                }
            },
            "required": ["top_three_ids"]
        }
    }
    
    client = genai.Client()
    tools = types.Tool(function_declarations=[select_top_3_tool])
    config = types.GenerateContentConfig(tools=[tools])

    try:
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
            
        prompt = f"""
        这是我的原始问题图片。下面是一个从题库中找到的、与之可能相关的题目列表。

        请你仔细比对图片中的问题和列表中的每一个问题，然后调用`select_top_three_problems`工具，返回列表中与图片问题**相关性最高、最相似**的**三个**题目的ID。

        候选题目列表如下:
        ---
        {formatted_problems}
        """
        
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type='image/png'),
            prompt
        ]
    except FileNotFoundError:
        print(f"❌ 错误: 找不到图片文件 '{image_path}'")
        return None

    # 4. 发送请求并解析响应
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config
        )
        if response.candidates and response.candidates[0].content.parts:
            function_call = response.candidates[0].content.parts[0].function_call
            if function_call.name == "select_top_three_problems":
                top_ids = function_call.args.get("top_three_ids")
                if top_ids and len(top_ids) == 3:
                    print(f"✅ Gemini成功精选出3个最相关题目, ID为: {top_ids}")
                    return top_ids
        
        print("❌ LLM未能成功调用精选工具，将返回原始列表。")
        return candidate_ids # 如果失败，返回所有候选ID

    except Exception as e:
        print(f"❌ 调用Gemini API进行精选时发生错误: {e}")
        return candidate_ids # 如果失败，返回所有候选ID


# ==============================================================================
#  主程序入口
# ==============================================================================
if __name__ == "__main__":
    # --- 步骤 0: 配置和准备 ---
    # if not configure_api_key():
    #     exit() # 如果API Key未配置，则退出

    # --- 步骤 1 & 2: 获取并处理知识点树 ---
    knowledge_tree_data = fetch_knowledge_tree()
    if not knowledge_tree_data:
        exit()

    choices_for_llm, id_lookup_map = process_knowledge_tree(knowledge_tree_data)
    if not choices_for_llm:
        print("未能从知识点树中提取任何有效的叶子节点。")
        exit()
    
    # 打印少量示例供参考
    print(f"\nℹ️ 已生成 {len(choices_for_llm)} 个知识点选项，部分示例如下:")
    for choice in choices_for_llm[:3]:
        print(f"  - {choice}")
    print("  - ...")

    # --- 步骤 3: 使用真实LLM进行分析 ---
    # 调用我们的核心函数，传入图片路径和知识点选项
    selected_knowledge_path = get_knowledge_point_from_llm(
        image_path="math_problem.png",
        knowledge_point_choices=choices_for_llm
    )

    # --- 步骤 4: 根据LLM的结果执行后续操作 ---
    if selected_knowledge_path:
        # 使用映射字典找到对应的ID
        target_id = id_lookup_map.get(selected_knowledge_path)
        if target_id:
            print(f"\n  -> 后台映射: 成功将路径映射到ID '{target_id}'")
            # 使用获取到的ID去查询题目
            initial_results = query_stzy_api(target_id)
            
            # --- 步骤 5: AI精选题目 ---
            if initial_results and initial_results.get("data", {}).get("list"):
                initial_problem_list = initial_results["data"]["list"]
                
                # 调用新增的精选函数
                top_3_problem_ids = rank_problems_with_llm(
                    image_path="math_problem.png",
                    problem_list=initial_problem_list
                )

                # 根据返回的ID列表，过滤出最终的题目
                final_problems = [p for p in initial_problem_list if p.get('questionId') in top_3_problem_ids]

                print("\n" + "="*25 + " 最终结果 " + "="*25)
                print("🏆 AI为您精选出以下3个最相关的题目：")
                print(json.dumps(final_problems, indent=2, ensure_ascii=False))
            else:
                print("未能获取初步题目列表，无法进行AI精选。")
        else:
            print(f"❌ 错误: 在映射字典中找不到路径 '{selected_knowledge_path}' 对应的ID。")
    else:
        print("\n未能从LLM获取有效的知识点，程序终止。")