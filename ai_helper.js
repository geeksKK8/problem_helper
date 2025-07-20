import { GoogleGenAI, Type } from '@google/genai';
import * as fs from 'node:fs';
import fetch from 'node-fetch';

// ==============================================================================
//  前置准备与配置
// ==============================================================================

function configureApiKey() {
    /**配置Google AI API密钥*/
    try {
        // 优先从环境变量读取API Key
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.log("❌ 错误: GOOGLE_API_KEY 环境变量未设置。");
            return false;
        }
        return true;
    } catch (e) {
        console.log(`❌ API密钥配置失败: ${e}`);
        return false;
    }
}

// ==============================================================================
//  数据获取与处理函数
// ==============================================================================

async function fetchKnowledgeTree(studyPhase = "300", subject = "2") {
    const url = "https://qms.stzy.com/matrix/zw-zzw/api/v1/zzw/tree/kpoint";
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Host': 'qms.stzy.com',
        'Origin': 'https://zj.stzy.com',
        'Referer': 'https://zj.stzy.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrTmFtZSI6IjE5OCoqKio1NzIyIiwiaWQiOiI1OTk1ODEwMjgxMDYzNzUxNjgiLCJleHAiOjE3NTI1MzUwOTAsInR5cGUiOiIxIiwiaWF0IjoxNzUyNTM1MDg5LCJqdGkiOiIxMmI3YzZjODUyZTk0OTFjYjY1YWZiMjk1Yjc2ZjhjYyIsImF1dGhvcml0aWVzIjpbXSwidXNlcm5hbWUiOiJzdHdfNTk5NTgxMDI4MTA2Mzc1MTY4In0.enBCCkVKFatlPUwC9-QIIVn_a6oOprnWHlZ8qL_zcu8BRfHwMuH5tOkySj4CE1FhLFNHT-6uBzPFABXfkoDIIRRCwoZv-RVNvCkf1F0-NuzrxeKlfnet4XT8GK4QKUe03j0pRgyS2GS2u8_57MhgOSBD9NLLZ91VfZ2mGLOGgLY'
    };
    const payload = { studyPhaseCode: studyPhase, subjectCode: subject };
    
    try {
        console.log("🚀 正在从API获取知识点树...");
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            timeout: 15000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log("✅ 知识点树获取成功!");
        return await response.json();
    } catch (e) {
        console.log(`❌ 获取知识点树失败: ${e}`);
        return null;
    }
}

function processKnowledgeTree(jsonData) {
    const llmChoicesList = [];
    const knowledgePointMap = {};
    
    function flattenRecursive(nodes, pathTitles) {
        for (const node of nodes) {
            const currentTitle = node.title;
            if (!currentTitle) continue;
            
            if (node.isLeaf === true) {
                const fullPathTitle = pathTitles.concat([currentTitle]).join(" -> ");
                llmChoicesList.push(fullPathTitle);
                knowledgePointMap[fullPathTitle] = node.id;
            }
            
            if (node.children) {
                const newPath = pathTitles.concat([currentTitle]);
                flattenRecursive(node.children, newPath);
            }
        }
    }
    
    const rootNodes = jsonData.data || [];
    flattenRecursive(rootNodes, []);
    return [llmChoicesList, knowledgePointMap];
}

async function queryStzyApi(knowledgePointId) {
    const url = "https://qms.stzy.com/matrix/zw-search/api/v1/homeEs/question/keyPointQuery";
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Host': 'qms.stzy.com',
        'Origin': 'https://zj.stzy.com',
        'Referer': 'https://zj.stzy.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrTmFtZSI6IjE5OCoqKio1NzIyIiwiaWQiOiI1OTk1ODEwMjgxMDYzNzUxNjgiLCJleHAiOjE3NTI1MzUwOTAsInR5cGUiOiIxIiwiaWF0IjoxNzUyNTM1MDg5LCJqdGkiOiIxMmI3YzZjODUyZTk0OTFjYjY1YWZiMjk1Yjc2ZjhjYyIsImF1dGhvcml0aWVzIjpbXSwidXNlcm5hbWUiOiJzdHdfNTk5NTgxMDI4MTA2Mzc1MTY4In0.enBCCkVKFatlPUwC9-QIIVn_a6oOprnWHlZ8qL_zcu8BRfHwMuH5tOkySj4CE1FhLFNHT-6uBzPFABXfkoDIIRRCwoZv-RVNvCkf1F0-NuzrxeKlfnet4XT8GK4QKUe03j0pRgyS2GS2u8_57MhgOSBD9NLLZ91VfZ2mGLOGgLY'
    };
    const payload = {
        onlyCheckUrlAndMethod: true,
        pageNum: 1,
        pageSize: 10,
        params: {
            studyPhaseCode: "300",
            subjectCode: "2",
            searchType: 2,
            sort: 0,
            yearCode: "",
            gradeCode: "",
            provinceCode: "",
            cityCode: "",
            areaCode: "",
            organizationCode: "",
            termCode: "",
            keyWord: "",
            filterQuestionFlag: false,
            searchScope: 0,
            treeIds: [knowledgePointId]
        }
    };
    
    try {
        console.log(`\n🚀 正在使用知识点ID '${knowledgePointId}' 查询相关题目...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log("✅ 题目查询成功!");
        return await response.json();
    } catch (e) {
        console.log(`❌ 题目查询失败: ${e}`);
        return null;
    }
}

// ==============================================================================
//  调用真实LLM并使用工具的核心函数
// ==============================================================================

async function getKnowledgePointFromLLM(imagePath, knowledgePointChoices) {
    /**
     * 使用Gemini模型分析图片中的数学问题，并从给定列表中选择一个知识点。
     * 
     * @param {string} imagePath - 题目图片的路径
     * @param {Array} knowledgePointChoices - 提供给LLM的、扁平化的知识点选项列表
     * @returns {string|null} LLM选择的知识点路径，如果失败则返回null
     */
    console.log("\n🤖 调用Gemini模型进行分析...");
    
    // 1. 定义工具 (Function Calling)
    const selectTool = {
        name: "select_knowledge_point",
        description: "根据数学问题，选择一个最相关的知识点",
        parameters: {
            type: Type.OBJECT,
            properties: {
                knowledge_point_path: {
                    type: Type.STRING,
                    description: "问题的核心知识点路径",
                    enum: knowledgePointChoices // 关键！将我们的列表作为枚举值
                }
            },
            required: ["knowledge_point_path"]
        }
    };

    const ai = new GoogleGenAI({});
    const tools = [{ functionDeclarations: [selectTool] }];
    const config = { tools: tools };

    // 3. 读取图片并构建请求内容
    try {
        const imageBytes = fs.readFileSync(imagePath);
        const base64Image = imageBytes.toString('base64');
        
        const prompt = "请仔细理解图中的数学问题，然后调用`select_knowledge_point`工具，选择和该问题最相关的一个知识点路径。";
        
        const contents = [
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Image,
                },
            },
            { text: prompt }
        ];
        
        // 4. 发送请求并解析响应
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: config,
        });
        
        // 检查LLM是否正确调用了我们的工具
        if (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];
            if (functionCall.name === "select_knowledge_point") {
                const selectedPath = functionCall.args.knowledge_point_path;
                console.log(`✅ Gemini成功调用工具并选择了: '${selectedPath}'`);
                return selectedPath;
            }
        }
        
        console.log("❌ LLM未能成功调用工具。");
        // 打印原始响应以供调试
        console.log("--- LLM原始响应 ---");
        console.log(response.text);
        console.log("--------------------");
        return null;

    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log(`❌ 错误: 找不到图片文件 '${imagePath}'`);
        } else {
            console.log(`❌ 调用Gemini API时发生错误: ${e}`);
        }
        return null;
    }
}

function cleanHtml(rawHtml) {
    /**一个简单的HTML清理函数*/
    if (!rawHtml) return '';
    const cleanText = rawHtml.replace(/<.*?>/g, ''); // 移除所有HTML标签
    return cleanText.replace(/&nbsp;/g, ' ').trim(); // 替换空格并去除首尾空白
}

async function rankProblemsWithLLM(imagePath, problemList) {
    /**
     * 【新增功能】调用Gemini，从一个题目列表中，根据图片选出最相关的三个。
     */
    console.log("\n🤖 [LLM任务2] 调用Gemini进行题目相关性排序与精选...");

    if (!problemList || problemList.length < 3) {
        console.log("ℹ️ 候选题目不足3个，跳过AI精选。");
        return problemList.map(p => p.questionId);
    }

    // 1. 准备给LLM的格式化数据
    const candidateIds = problemList.map(p => p.questionId);
    let formattedProblems = "";
    for (const problem of problemList) {
        const problemId = problem.questionId || 'N/A';
        // 从题目内容中提取文本，并清理HTML标签
        const problemContent = cleanHtml(problem.questionArticle || '');
        formattedProblems += `题目ID: ${problemId}\n题目内容: ${problemContent}\n---\n`;
    }
    
    // 2. 定义排序和选择的工具
    const selectTop3Tool = {
        name: "select_top_three_problems",
        description: "从一个候选题目列表中，根据图片中的原始问题，选择出最相似的三个题目的ID。",
        parameters: {
            type: Type.OBJECT,
            properties: {
                top_three_ids: {
                    type: Type.ARRAY,
                    description: "包含三个最相关题目ID的列表",
                    items: {
                        type: Type.STRING,
                        enum: candidateIds // 确保LLM返回的ID是候选ID之一
                    }
                }
            },
            required: ["top_three_ids"]
        }
    };
    
    const ai = new GoogleGenAI({});
    const tools = [{ functionDeclarations: [selectTop3Tool] }];
    const config = { tools: tools };

    try {
        const imageBytes = fs.readFileSync(imagePath);
        const base64Image = imageBytes.toString('base64');
        
        const prompt = `
        这是我的原始问题图片。下面是一个从题库中找到的、与之可能相关的题目列表。

        请你仔细比对图片中的问题和列表中的每一个问题，然后调用\`select_top_three_problems\`工具，返回列表中与图片问题**相关性最高、最相似**的**三个**题目的ID。

        候选题目列表如下:
        ---
        ${formattedProblems}
        `;
        
        const contents = [
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Image,
                },
            },
            { text: prompt }
        ];
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: config,
        });
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];
            if (functionCall.name === "select_top_three_problems") {
                const topIds = functionCall.args.top_three_ids;
                if (topIds && topIds.length === 3) {
                    console.log(`✅ Gemini成功精选出3个最相关题目, ID为: ${topIds}`);
                    return topIds;
                }
            }
        }
        
        console.log("❌ LLM未能成功调用精选工具，将返回原始列表。");
        return candidateIds; // 如果失败，返回所有候选ID

    } catch (e) {
        console.log(`❌ 调用Gemini API进行精选时发生错误: ${e}`);
        return candidateIds; // 如果失败，返回所有候选ID
    }
}

// ==============================================================================
//  主程序入口
// ==============================================================================

async function main() {
    // --- 步骤 0: 配置和准备 ---
    // if (!configureApiKey()) {
    //     process.exit(1); // 如果API Key未配置，则退出
    // }

    // --- 步骤 1 & 2: 获取并处理知识点树 ---
    const knowledgeTreeData = await fetchKnowledgeTree();
    if (!knowledgeTreeData) {
        process.exit(1);
    }

    const [choicesForLLM, idLookupMap] = processKnowledgeTree(knowledgeTreeData);
    if (!choicesForLLM || choicesForLLM.length === 0) {
        console.log("未能从知识点树中提取任何有效的叶子节点。");
        process.exit(1);
    }
    
    // 打印少量示例供参考
    console.log(`\nℹ️ 已生成 ${choicesForLLM.length} 个知识点选项，部分示例如下:`);
    for (let i = 0; i < Math.min(3, choicesForLLM.length); i++) {
        console.log(`  - ${choicesForLLM[i]}`);
    }
    console.log("  - ...");

    // --- 步骤 3: 使用真实LLM进行分析 ---
    // 调用我们的核心函数，传入图片路径和知识点选项
    const selectedKnowledgePath = await getKnowledgePointFromLLM(
        "math_problem.png",
        choicesForLLM
    );

    // --- 步骤 4: 根据LLM的结果执行后续操作 ---
    if (selectedKnowledgePath) {
        // 使用映射字典找到对应的ID
        const targetId = idLookupMap[selectedKnowledgePath];
        if (targetId) {
            console.log(`\n  -> 后台映射: 成功将路径映射到ID '${targetId}'`);
            // 使用获取到的ID去查询题目
            const initialResults = await queryStzyApi(targetId);
            
            // --- 步骤 5: AI精选题目 ---
            if (initialResults && initialResults.data && initialResults.data.list) {
                const initialProblemList = initialResults.data.list;
                
                // 调用新增的精选函数
                const top3ProblemIds = await rankProblemsWithLLM(
                    "math_problem.png",
                    initialProblemList
                );

                // 根据返回的ID列表，过滤出最终的题目
                const finalProblems = initialProblemList.filter(p => 
                    top3ProblemIds.includes(p.questionId)
                );

                console.log("\n" + "=".repeat(25) + " 最终结果 " + "=".repeat(25));
                console.log("🏆 AI为您精选出以下3个最相关的题目：");
                console.log(JSON.stringify(finalProblems, null, 2));
            } else {
                console.log("未能获取初步题目列表，无法进行AI精选。");
            }
        } else {
            console.log(`❌ 错误: 在映射字典中找不到路径 '${selectedKnowledgePath}' 对应的ID。`);
        }
    } else {
        console.log("\n未能从LLM获取有效的知识点，程序终止。");
    }
}

// 如果直接运行此文件，则执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

// 导出函数供其他模块使用
export {
    configureApiKey,
    fetchKnowledgeTree,
    processKnowledgeTree,
    queryStzyApi,
    getKnowledgePointFromLLM,
    cleanHtml,
    rankProblemsWithLLM,
    main
}; 