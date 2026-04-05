---
name: create-astro-component
description: Astro コンポーネントをプロジェクト規約に沿って作成する。Props 定義と、JavaScript を伴う場合のカスタム要素パターンを適用する。
argument-hint: "[作りたいコンポーネントの要件]"
---

$ARGUMENTS の要件に基づいて Astro コンポーネントを作成する。引数が省略された場合は、ユーザーに要件を確認すること。

以下の規約に従うこと。

## Props 定義

必ず `Props` インターフェースを定義し、対応する HTML 要素の `HTMLAttributes` を extends する。

```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"p"> {}

const { ...rest } = Astro.props;
---

<p {...rest}>...</p>
```

## カスタム要素（JavaScript を伴う場合）

クライアントサイド JavaScript が必要な場合は、カスタム要素（Custom Elements）に切り出す。

1. ルート要素をカスタム要素タグで囲む（例: `<greeting-component>`）
2. `<script>` 内で `HTMLElement` を継承したクラスを定義し、`customElements.define()` で登録する
3. DOM 操作はカスタム要素の `connectedCallback()` 内で行う

```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"p"> {}

const { ...rest } = Astro.props;
---

<greeting-component>
  <p {...rest}>Loading...</p>
</greeting-component>

<script>
  import { apiClient } from "../lib/api-client.js";

  export class GreetingComponent extends HTMLElement {
    async connectedCallback() {
      const p = this.querySelector("p")!;
      const res = await apiClient.greeting.$get();
      p.textContent = await res.text();
    }
  }

  customElements.define("greeting-component", GreetingComponent);
</script>
```

## id 属性の扱い

コンポーネント内で `id` 属性を決め打ちしない。コンポーネント外との重複を避けるため、以下の優先順で選択する。

1. **要素名で選択** — `this.querySelector("p")`, `this.querySelector("dialog")` など。カスタム要素 (`this`) 内にスコープされるため、同じ要素名でもコンポーネント外とは衝突しない。
2. **`class` 属性で選択** — 同じ要素が複数ある場合は class で区別する。Astro コンポーネントは `data-astro-*` 属性が自動付与されるため、スタイルの副作用は抑えられる。
3. **Props から受け取る** — 外部から参照が必要な場合のみ `id` を Props 経由で受け取る。

## 命名規則

- カスタム要素タグ: ケバブケース + `-component` サフィックス（例: `greeting-component`, `me-component`）
- クラス名: パスカルケース + `Component` サフィックス（例: `GreetingComponent`, `MeComponent`）
