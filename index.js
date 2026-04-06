const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log("1. ログインページへ移動中...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle2' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.type('input[name="memberid"]', process.env.XSERVER_ID);
    
    console.log("3. フォームを強制送信して次へ...");
    // ボタンを探してクリックするのではなく、フォーム自体をsubmit（送信）します
    await Promise.all([
      page.evaluate(() => {
        document.querySelector('form').submit();
      }),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log("4. パスワード欄の出現を待機...");
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 30000 });
    await page.type('input[name="password"]', process.env.XSERVER_PW);

    console.log("5. ログインを実行...");
    await Promise.all([
      page.evaluate(() => {
        document.querySelector('form').submit();
      }),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log("6. VPS管理画面へ直接移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    console.log("7. 更新ボタンをスキャン中...");
    // 3秒待機して要素を確定させる
    await new Promise(r => setTimeout(r, 3000));
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
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.log("ℹ️ 更新ボタンが見つかりません。まだ更新期間外か、既に更新済みです。");
    }

  } catch (error) {
    console.error("❌ エラー詳細:", error.message);
    // どこで止まったか特定するためスクリーンショットを保存（ActionsのArtifactsで確認可能）
    await page.screenshot({ path: 'error_screenshot.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
