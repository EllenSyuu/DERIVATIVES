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

| 课 | 主题 | 参考章节 |
| --- | --- | --- |
| 1 | 衍生品是什么 | Hull 第 1 章 |
| 2 | 远期与期货的盈亏 | Hull 第 2、5 章 |
| 3 | 利率与连续复利 | Hull 第 4 章 |
| 4 | 远期价格：无收益资产 | Hull 第 5 章 |
| 5 | 期权到期的收益 | Hull 第 9–10 章 |
| 6 | 看涨看跌平价 | Hull 第 9 章 |
| 7 | 对冲比率与基差 | Hull 第 3 章 |
| 8 | 二叉树定价 | Hull 第 13 章 |
| 9 | Black-Scholes 定价 | Hull 第 13 章 |
| 10 | 希腊字母：Delta | Hull 第 17 章 |

章节号只用来帮助对照教材，讲解和例子都是原创的。之后会陆续加入互换（swap）、利率衍生品和风险价值（VaR）。

## 本地运行

没有构建步骤，就是一组静态文件：

```bash
npm test          # 检查每一道题、每一个公式
npm run serve     # 然后打开 http://localhost:8000
```

## 怎么保证答案是对的

- 每道题都是生成器：`npm test` 用 40 组随机种子运行，检查选择题只有一个正确答案、没有重复选项。
- 公式的数值用已知结果检验，例如 Black-Scholes 的经典例子（S=42, K=40, r=10%, T=0.5, σ=20%）应得看涨约 4.76、看跌约 0.81。
- 看跌看涨平价在大量随机输入下成立。

## 进度

进度只保存在你自己这台浏览器的 localStorage 里，不上传，也没有账号。清除浏览器数据会清空进度。

## 许可

Apache-2.0。见 [LICENSE](LICENSE)。
