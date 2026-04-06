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
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle0' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.focus('input[name="memberid"]');
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: 150 });
    
    // 少し待ってからEnterキーを叩く
    await new Promise(r => setTimeout(r, 1000));
    await page.keyboard.press('Enter');

    console.log("3. パスワード欄の出現を待機...");
    // 30秒待っても出ない場合は、現在の画面に何が表示されているか確認する
    try {
      await page.waitForSelector('input[name="password"]', { visible: true, timeout: 20000 });
    } catch (e) {
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes("ロボット")) {
        throw new Error("ロボットチェック（CAPTCHA）が表示されました。");
      } else if (text.includes("正しくありません")) {
        throw new Error("会員IDが正しくありません。");
      } else {
        throw new Error(`パスワード欄が出ません。画面内容: ${text.substring(0, 100)}...`);
      }
    }

    console.log("4. パスワードを入力中...");
    await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: 150 });
    await page.keyboard.press('Enter');

    console.log("5. ログイン後の遷移を待機...");
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    console.log("6. VPS管理画面へ直接移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle0' });

    console.log("7. 更新ボタンをスキャン中...");
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
      console.log("ℹ️ 更新ボタンが見つかりません。期間外です。");
    }

  } catch (error) {
    console.error("❌ エラー詳細:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
