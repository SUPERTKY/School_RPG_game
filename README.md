# School_RPG_game
## 問題ファイルを追加する場合の形式

現時点のバトルでは問題ファイルを読み込まず、有効得点を常に `1` として技の効果を計算します。
将来、問題ファイルを作る場合は、教科・難易度ごとにJSONファイルを分け、次の形式で作成してください。

```json
[
  {
    "id": "math-normal-001",
    "subject": "数学",
    "difficulty": "normal",
    "question": "一次方程式 2x + 3 = 11 の解はどれですか。",
    "choices": ["x = 2", "x = 3", "x = 4", "x = 5"],
    "answerIndex": 2,
    "explanation": "2x + 3 = 11 なので、2x = 8、x = 4 です。"
  }
]
```

- `difficulty` は通常問題なら `normal`、難しい問題なら `hard` にします。
- `choices` は必ず4つにし、正解は1つだけにします。
- `answerIndex` は `choices` の0始まりの番号です。上の例では3番目の選択肢が正解なので `2` です。
- `explanation` には対戦後に表示できる短い解説を書きます。

## オンライン開催状態（KV）の準備

KV は Cloudflare の「Key-Value（キーと値）」保存場所です。このゲームでは、管理者が「開催する」を押したときの状態（開催中かどうか、選んだ教科）をオンラインで共有するために使います。

ローカルのブラウザ保存では、管理者の端末だけにしか開催状態が残りません。Cloudflare KV に保存すると、別の端末で開いたプレイヤー画面も同じ開催状態を取得できます。

### Cloudflare Pages で必要な設定

1. Cloudflare ダッシュボードで、この Pages プロジェクトを開きます。
2. **Settings** → **Functions** → **KV namespace bindings** を開きます。
3. KV namespace を作成し、バインディング画面では次のように入力します。
   - **変数名**: `GAME_SESSION_KV`
   - **KV 名前空間**: 作成した KV namespace を選択
4. **Settings** → **Environment variables** で次の値を設定します。
   - `PASSWORD`: プレイヤーがゲーム画面へ入るためのパスワード
   - `ADMIN_PASSWORD`: 管理者画面と開催状態の更新に使うパスワード
5. デプロイし直します。

### 補足

- KV の「エントリー」は手動で作らなくて大丈夫です。管理者画面で「開催する」を押すと、アプリが自動で `current` というエントリーを作成・更新します。
- Cloudflare で「キー」と「値」を入力する画面が出ている場合、それは KV エントリーの手動作成画面です。通常は入力せずに戻り、Pages の **KV namespace bindings** で `GAME_SESSION_KV` を紐づけてください。
- どうしてもテスト用に手動作成する場合だけ、キーは `current`、値は `{"hosted":false,"selectedSubjectKey":"math"}` にします。
- 管理者とプレイヤーで開催状態を共有するには、`GAME_SESSION_KV` の binding が必須です。未設定の場合はオンライン共有できないため、開催/取得はエラーになります。
- マッチングのオンライン処理はまだ実装していません。現時点では「管理者がオンラインで開催/終了を切り替え、プレイヤー画面に反映する」ところまでです。

### KV namespace が Pages の選択欄に出てこない場合

- Cloudflare 公式ドキュメントでは、Pages プロジェクトの **Settings** → **Bindings** → **Add** から KV namespace を紐づけます。古い画面では **Settings** → **Functions** → **KV namespace bindings** と表示される場合があります。
- KV namespace を作った直後は、選択欄に反映されるまで少し待つか、Cloudflare ダッシュボードを再読み込みしてください。
- Pages プロジェクトと KV namespace が同じ Cloudflare アカウント内にあるか確認してください。別アカウントに作った KV namespace は選択欄に出ません。
- **Environment variables** ではなく **Bindings** / **KV namespace bindings** で設定してください。`GAME_SESSION_KV` は通常の文字列の環境変数ではなく、KV namespace binding の変数名です。
- Production と Preview の設定が分かれている場合は、実際に使う環境（本番なら Production）側にも同じ binding を追加してください。
