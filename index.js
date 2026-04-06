const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=ja']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log("1. ログインページへ移動中...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle2' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    // 一文字ずつゆっくり入力（ボット検知回避）
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: 100 });
    
    console.log("3. 『次へ』をクリック...");
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // ログインに失敗してエラーメッセージが出ているかチェック
    const loginError = await page.evaluate(() => {
      const errorEl = document.querySelector('.error_message, .alert-danger');
      return errorEl ? errorEl.innerText : null;
    });

    if (loginError) {
      throw new Error(`ID入力後にエラーが発生しました: ${loginError}`);
    }

    console.log("4. パスワード欄の出現を待機...");
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 20000 });
    await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: 100 });

    console.log("5. ログイン実行...");
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log("6. VPS管理画面へ移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    console.log("7. 更新ボタンを確認中...");
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
      console.log("✅ 更新ボタンをクリックしました。");
    } else {
      console.log("ℹ️ 更新ボタンが見つかりません。期間外です。");
    }

  } catch (error) {
    console.error("❌ エラー詳細:", error.message);
    // エラー時の画面をHTMLとして出力（ログで状況を確認するため）
    const html = await page.content();
    console.log("--- エラー時のページ構造 (一部) ---");
    console.log(html.substring(0, 1000)); 
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
