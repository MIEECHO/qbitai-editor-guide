import fs from "node:fs";
import path from "node:path";

const sourcePath = "/Users/yuyang/Desktop/编辑部新手攻略（2023，更新中）.md";
const titleGuidePath = "/Users/yuyang/Desktop/如何起标题.md";
const outPath = path.join(process.cwd(), "data", "guide.json");
const source = fs.readFileSync(sourcePath, "utf8");

function cleanText(text) {
  return text
    .replace(/\\([~_\-.#+])/g, "$1")
    .replace(/\*\*\s*\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const doc = {
    title: "",
    intro: [],
    sections: [],
  };
  let currentH1 = null;
  let currentH2 = null;
  let currentH4 = null;

  function currentBlock() {
    if (currentH4) return currentH4;
    if (currentH2) return currentH2;
    if (currentH1) return currentH1;
    return null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const title = cleanText(heading[2]);
      if (level === 1 && !doc.title) {
        doc.title = title;
        continue;
      }
      if (level === 1) {
        currentH1 = { title, lead: [], children: [] };
        doc.sections.push(currentH1);
        currentH2 = null;
        currentH4 = null;
      } else if (level === 2) {
        currentH2 = { title, body: [], children: [] };
        currentH1?.children.push(currentH2);
        currentH4 = null;
      } else {
        currentH4 = { title, body: [] };
        currentH2?.children.push(currentH4);
      }
      continue;
    }

    if (!currentH1) {
      doc.intro.push(line);
      continue;
    }

    const target = currentBlock();
    const isList = /^[-*]\s+/.test(line);
    const content = isList ? line.replace(/^[-*]\s+/, "") : line;
    target.body ??= target.lead ?? [];
    target.body.push({ type: isList ? "li" : "p", text: content });
  }

  return doc;
}

function flattenText(section) {
  const parts = [section.title];
  for (const child of section.children || []) {
    parts.push(child.title, ...(child.body || []).map((item) => item.text));
    for (const sub of child.children || []) {
      parts.push(sub.title, ...(sub.body || []).map((item) => item.text));
    }
  }
  return cleanText(parts.join(" "));
}

function parseTitleGuide(md) {
  const items = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      if (level === 1) continue;
      items.push({
        type: level === 2 ? "heading" : "subheading",
        text: cleanText(heading[2]).replace(/==/g, ""),
      });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      items.push({ type: "li", text: bullet[1].trim() });
      continue;
    }

    items.push({ type: "p", text: line });
  }

  return [
    {
      type: "p",
      text: "对于微信公众号文章来说，适度的标题党是必要的，好的标题是文章成功的一大半，差的标题注定要凉凉。",
    },
    ...items,
  ];
}

function updateTitleGuide(module, titleBody) {
  if (!module || module.title !== "五、写作基础") return;
  const titleSkill = module.children?.find((item) => item.title === "3、取标题技巧");
  if (titleSkill) titleSkill.body = titleBody;
}

const doc = parseMarkdown(source);
const allText = doc.sections.map(flattenText).join(" ");
const guide = {
  title: doc.title,
  intro: doc.intro.map(cleanText),
  sections: doc.sections,
  modules: doc.sections.flatMap((section) =>
    section.children.map((child) => ({ ...child, parent: section.title }))
  ),
  outlineTemplate: `标题方向：
XXXX

## 开头
1、重点信息1
2、重点信息2
3、重点信息3

## 第一个小标题
1、具体内容1
2、具体内容2
3、具体内容3

## 第二个小标题
4、具体内容4
5、具体内容5
6、具体内容6`,
  sourceStamp: new Date().toISOString().slice(0, 10),
  sourceDocument: "编辑部新手攻略（2023，更新中）.md",
  heroFocus: [
    "理解量子位定位：懂技术，说人话",
    "掌握选题、提纲、初稿节奏",
    "学习标题、开头和易读性技巧",
    "发稿前完成版权与链接检查",
  ],
  checkItems: [
    "8:30 前回复查收当天任务",
    "9:30 前提交提纲并明确标题方向",
    "11:30 前提交初稿给带班老师和主编",
    "开头突出最重要、最劲爆的信息",
    "文章摘要不与标题信息重复",
    "不放外部跳转链接、二维码",
    "所有图片和图片文字确认版权",
    "引用内容注明出处，严禁抄袭",
    "外媒翻译找到源头，不用二道贩子中文翻译",
  ],
  resources: [
    {
      title: "AI 基础资料",
      description: "资料篇、知识要点篇与李宏毅机器学习",
      url: "https://jkhbjkhb.feishu.cn/docx/doxcnqXhYmpGPST6K9T5mOk87zf",
    },
    {
      title: "阅读书目",
      description: "人工智能简史、人工智能等入门书",
      url: "https://jkhbjkhb.feishu.cn/docx/doxcnA2t13dVuwM3cl2iNC50VCB",
    },
    {
      title: "编辑指南",
      description: "工具配置、贴稿和日常协作规范",
      url: "https://jkhbjkhb.feishu.cn/docx/doxcntq3TsD96LHTH99MD74Morb?from=from_copylink",
    },
    {
      title: "知识库首页",
      description: "更多内部学习资料与规范沉淀",
      url: "https://jkhbjkhb.feishu.cn/wiki/wikcnT4LIVFJC1xipWCER9Hkpkf",
    },
  ],
  stats: {
    sections: doc.sections.length,
    modules: doc.sections.reduce((sum, section) => sum + section.children.length, 0),
    words: allText.length,
  },
};

if (fs.existsSync(titleGuidePath)) {
  const titleBody = parseTitleGuide(fs.readFileSync(titleGuidePath, "utf8"));
  for (const section of guide.sections || []) {
    for (const child of section.children || []) updateTitleGuide(child, titleBody);
  }
  for (const module of guide.modules || []) updateTitleGuide(module, titleBody);
  guide.stats.words = JSON.stringify(guide.modules).length;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(guide, null, 2)}\n`);
console.log(outPath);
