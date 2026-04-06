const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ja']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  try {
    console.log("1. ログインページへ移動中...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle2' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: 100 });
    
    // ID入力後にボタンがあるか確認し、あれば押す。なければEnter。
    const step1Btn = await page.$('button[name="login_step1"]');
    if (step1Btn) {
      console.log("-> 『次へ』ボタンをクリックしました。");
      await step1Btn.click();
    } else {
      console.log("-> Enterキーを送信しました。");
      await page.keyboard.press('Enter');
    }

    // 画面の変化を少し待つ
    await new Promise(r => setTimeout(r, 3000));

    // エラーメッセージの有無を確認
    const errorMessage = await page.evaluate(() => {
      const el = document.querySelector('.error_message, .alert-danger, .error');
      return el ? el.innerText : null;
    });

    if (errorMessage) {
      console.log(`⚠️ 画面上にエラーが表示されています: ${errorMessage}`);
      // エラーが出ている場合は、IDが間違っている可能性が高いです。
    }

    console.log("3. パスワード欄をチェック中...");
    const hasPasswordField = await page.$('input[name="password"]');
    
    if (hasPasswordField) {
      console.log("-> パスワードを入力します。");
      await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: 100 });
      await page.keyboard.press('Enter');
    } else {
      console.log("❌ パスワード入力欄が見つかりません。ID入力で弾かれています。");
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log("--- 現在の画面テキスト (詳細) ---");
      console.log(bodyText.substring(0, 500));
      process.exit(1);
    }

    console.log("4. ログイン後の遷移を待機...");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => console.log("待機タイムアウト（無視して進みます）"));

    console.log("5. VPS管理画面へ移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    console.log("6. 更新ボタンを確認中...");
    await new Promise(r => setTimeout(r, 5000));
    const result = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const updateLink = links.find(l => l.innerText.includes('更新する'));
      if (updateLink) {
        updateLink.click();
        return "success";
      }
      return "not_found";
    });
    
    if (result === "success") {
      console.log("✅ 更新処理を実行しました。");
    } else {
      console.log("ℹ️ 更新ボタンが見つかりませんでした。");
    }

  } catch (error) {
    console.error("❌ システムエラー:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
