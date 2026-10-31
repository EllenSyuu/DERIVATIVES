<div align="center">

# Derivatives Notebook · 衍生品自学笔记

**A beginner-friendly self-study notebook for derivatives: forwards, futures, options and Black-Scholes, one short idea at a time.**

[**Open the notebook →**](https://ellensyuu.github.io/derivatives/)

![Licence](https://img.shields.io/badge/licence-Apache--2.0-22314a)
![No build step](https://img.shields.io/badge/build-none%20·%20vanilla%20ES%20modules-cf602b)

</div>

## 这是什么

给完全没有金融背景的人看的衍生品入门。每一课：

1. **核心想法**：用几句话讲清楚直觉。
2. **公式**：每个公式都配一句中文含义。
3. **跟着做**：一个写满了每一步理由的例子。
4. **练习**：每次出的数字都不一样，错了会在合适的时候再回来（间隔复习）。

不需要计算器也能做的题尽量设计成这样；需要算的，直接在页面里输入数字。

## 课程

按 Hull《Options, Futures and Other Derivatives》（第 7 版）的章节顺序，共 34 章。

- **按教材对齐**：小节标题和顺序与教材一致，例子用书中的数字，课后习题用书中的题号。目前有第 1–2 章。
- **待对齐**：早期版本的内容，会在之后逐章替换为按教材的版本。
- **待编写**：还没有内容。

## 怎么批改

- **选择题**：点选一个选项；错的选项会说明错在哪里。
- **数字题**：直接输入数字（可以带单位、逗号或括号负数）。符号反了、单位差了 100 倍，会给出具体提示。
- **文字题**：用自己的话写。系统按要点批改，每个要点的同义说法都算数；缺了哪一点会直接说出来。写"不是买入"这样的否定句，不会被当成"买入"。

## 本地运行

没有构建步骤，就是一组静态文件：

```bash
npm test          # 检查每一道题、每一个公式
npm run serve     # 然后打开 http://localhost:8000
```

## 怎么保证答案是对的

- 教材题的每个标准答案都要通过同一套批改规则，`npm test` 会检查。
- 早期生成的练习用 40 组随机种子检查：选择题只有一个正确答案，没有重复选项。
- 公式的数值用已知结果检验，例如 Black-Scholes 的经典例子应得看涨约 4.76、看跌约 0.81。

## 进度

进度只保存在你自己这台浏览器的 localStorage 里，不上传，也没有账号。清除浏览器数据会清空进度。

## 许可

Apache-2.0。见 [LICENSE](LICENSE)。
