> 必备项：1. 核心技术栈：精通 React、Next.js、TypeScript，具备扎实的组件化与工程化能力。2. 流式 UI 与异步渲染能力：具备处理后端流式文本与半结构化数据的经验；能基于不完整数据进行乐观式 UI 渲染（Optimistic UI）。3. 复杂状态管理与协作场景支持：具备从架构层面设计前端状态管理的能力；能支撑多人协作、实时会话、状态同步等复杂场景。4. 工程质量与设计落地能力：- 熟练使用 Playwright 进行端到端自动化测试；- 能借助 Chrome DevTools 进行性能分析；- 能将高保真 Figma 设计稿高质量还原为可复用组件代码。

> 加分项：1. 数据可视化经验：有 D3.js、Apache ECharts 等可视化库的实际项目经验。2. 实时协作能力：有基于 WebSocket、Liveblocks、Y.js 等方案的实时协作实践经验。3. 多媒体与画布相关经验：有 WebRTC（音视频）或 HTML5 Canvas、Fabric.js 等画布类库的使用经验。4. 动态渲染与沙箱执行经验：有在浏览器中进行动态组件渲染和代码沙箱执行（如 iframe、react-live、自定义渲染器）的实践经验。

## 一、必备项对应的面试题+答案

### 1. 核心技术栈（React/Next.js/TypeScript + 组件化/工程化）

#### 问题 1：React 中`useEffect`的依赖数组使用有哪些常见陷阱？怎么避免？

**答案**：
常见陷阱有 3 个：

- 陷阱 1：依赖数组漏写状态/变量，导致`useEffect`不触发更新（比如依赖了`count`但没写进数组）；
- 陷阱 2：依赖引用类型（比如对象、数组），每次渲染都会生成新引用，导致`useEffect`无限触发；
- 陷阱 3：清理函数执行时机错误（比如异步请求还没完成就卸载组件，导致内存泄漏）。

避免方法：

- 用 ESLint 插件（如`eslint-plugin-react-hooks`）强制检查依赖数组；
- 引用类型依赖用`useMemo`/`useCallback`缓存（比如`const config = useMemo(() => ({a: 1}), [])`）；
- 异步请求在清理函数中取消（比如用`AbortController`）。

#### 问题 2：Next.js 的 SSR、SSG、ISR 分别适用于什么场景？它们的渲染流程有什么区别？

**答案**：

- **SSR（服务端渲染）**：
  场景：动态内容（比如用户个人中心）、需要实时数据且要求 SEO 的页面；
  流程：用户请求 → 服务端拉取数据 → 服务端渲染 HTML→ 返回给客户端。

- **SSG（静态站点生成）**：
  场景：静态内容（比如官网首页、博客文章）、数据不常更新的页面；
  流程：构建时（`next build`）拉取数据 → 生成静态 HTML→ 部署后直接返回给用户。

- **ISR（增量静态再生）**：
  场景：数据更新不频繁的动态页（比如商品列表）；
  流程：首次请求用 SSG 生成静态页 → 后续请求命中缓存 → 到达过期时间后，服务端后台重新生成页面（用户无感知）。

#### 问题 3：你是怎么设计 React 通用按钮组件的？要考虑哪些点？

**答案**：
设计通用按钮会覆盖 4 个核心点：

1. **扩展性**：通过`props`支持不同类型（比如`variant="primary"/"secondary"`）、尺寸（`size="sm"/"md"/"lg"`）、状态（`disabled`、`loading`）；
2. **交互性**：支持自定义点击事件（`onClick`）、键盘触发（比如`onKeyDown`处理`Enter`/`Space`键）；
3. **复用性**：用 CSS Modules/Styled Components 做样式隔离，避免样式污染；
4. **兼容性**：适配不同场景（比如作为表单提交按钮时，支持`type="submit"`）。

示例核心代码：

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading,
  children,
  ...rest
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${
        loading ? "btn-loading" : ""
      }`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
};
```

### 2. 流式 UI 与异步渲染能力

#### 问题 1：后端返回流式文本（比如 AI 聊天回复），前端怎么接收并逐段渲染？

**答案**：
用浏览器的`ReadableStream` API 处理，流程是：

1. 发起`fetch`请求时，设置`responseType: 'stream'`；
2. 获取`response.body`（是一个`ReadableStream`），用`TextDecoder`解码流；
3. 逐段读取流数据，更新状态并渲染。

示例代码：

```tsx
const [streamText, setStreamText] = useState("");

const fetchStream = async () => {
  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ msg: "你好" }),
  });
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    setStreamText((prev) => prev + text); // 逐段追加文本
  }
};
```

#### 问题 2：乐观式 UI（Optimistic UI）是什么？适合什么场景？实现时要注意什么？

**答案**：

- 定义：用户操作后**先更新 UI**，再发请求；请求成功则保留 UI，失败则回滚——让用户感觉操作“更流畅”。
- 适合场景：高频轻量操作（比如点赞、收藏、增减购物车数量）。
- 注意点：必须处理“请求失败的回滚逻辑”，比如点赞后请求失败，要把“已点赞”状态改回“未点赞”；可以用`useState`存临时状态，请求完成后同步真实状态。

### 3. 复杂状态管理与协作场景

#### 问题 1：针对“多人协作、实时会话”场景，前端状态管理为什么不能只用普通的 Redux/Zustand？需要额外考虑什么？

**答案**：
普通 Redux/Zustand 是“客户端单机状态管理”，无法解决：

1. **多端状态同步**：其他用户的操作无法实时同步到当前客户端；
2. **并发冲突**：多人同时操作同一数据时，会出现状态不一致（比如两人同时编辑同一段文字）；
3. **服务端持久化**：客户端状态刷新后会丢失，无法和服务端数据对齐。

额外需要：

- 实时通信层（比如 WebSocket）同步状态；
- 冲突解决算法（比如 CRDT、OT）；
- 服务端状态持久化（比如把协作数据存在数据库）。

### 4. 工程质量与设计落地

#### 问题 1：用 Playwright 写一个“用户提交表单 → 页面更新”的端到端测试用例？

**答案**：
示例用例（测试“登录表单提交成功后跳转到首页”）：

```typescript
import { test, expect } from "@playwright/test";

test("用户登录成功后跳转到首页", async ({ page }) => {
  // 1. 进入登录页
  await page.goto("/login");

  // 2. 填写表单
  await page.fill("#username", "test-user");
  await page.fill("#password", "test-pass");

  // 3. 提交表单
  await page.click('button[type="submit"]');

  // 4. 断言：跳转到首页，且显示用户名
  await expect(page).toHaveURL("/home");
  await expect(page.locator("#user-name")).toContainText("test-user");
});
```

#### 问题 2：把 Figma 高保真稿还原成组件时，怎么保证“像素级还原”同时兼顾复用性？

**答案**：

1. **先拆组件**：把 Figma 里的“重复元素”（比如按钮、卡片）先拆成独立组件，避免重复写代码；
2. **用设计系统对齐规范**：把 Figma 里的颜色、字体、间距做成全局变量（比如`--color-primary: #165DFF`），组件直接引用变量；
3. **精确还原细节**：用 Figma 的“检查器”看尺寸、圆角、阴影参数，在 CSS 中精确设置（比如`border-radius: 8px`、`box-shadow: 0 2px 8px rgba(0,0,0,0.1)`）；
4. **适配响应式**：对自适应布局，用 Figma 的“约束”规则（比如宽度 100%、左右边距固定），在组件中用 Flex/Grid 实现。

## 二、加分项对应的面试题+答案

### 1. 数据可视化经验

#### 问题：用 ECharts 怎么做自定义 tooltip 和图表联动？

**答案**：

- **自定义 tooltip**：通过`tooltip.formatter`函数自定义内容，比如显示多维度数据：
  ```javascript
  tooltip: {
    formatter: (params) => {
      const data = params.data;
      return `<div>
        <p>名称：${data.name}</p>
        <p>数值：${data.value}</p>
        <p>占比：${(data.value / 100).toFixed(2)}%</p>
      </div>`;
    };
  }
  ```
- **图表联动**：监听`legendselectchanged`等事件，同步修改其他图表的`option`：
  ```javascript
  // 图表A选中图例后，图表B同步过滤数据
  chartA.on("legendselectchanged", (params) => {
    chartB.setOption({
      series: [
        {
          data: filterData(params.name), // 根据选中的图例过滤数据
        },
      ],
    });
  });
  ```

### 2. 实时协作能力

#### 问题：Liveblocks/Y.js 这类工具的“CRDT 算法”是干什么的？解决了实时协作中的什么问题？

**答案**：
CRDT 是“无冲突复制数据类型”，核心是：

- 让多个客户端同时编辑同一数据时，**不用加锁**，每个操作都会生成一个“唯一标识”；
- 最终所有客户端能自动合并操作，得到一致的状态。

解决的问题：
传统“锁机制”会导致“同一时间只能一个人编辑”，而 CRDT 实现了“多人同时编辑、实时同步、无冲突”，比如多人在线文档编辑时，两人同时改同一段文字也不会丢内容。
