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
    await page.waitForSelector('input[name="memberid"]', { visible: true, timeout: 60000 });
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: 100 });
    
    console.log("3. 『次へ』をクリック...");
    // ボタンが出るまで待機してからクリック
    await page.waitForSelector('button[name="login_step1"]', { visible: true, timeout: 60000 });
    await Promise.all([
      page.click('button[name="login_step1"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    console.log("4. パスワード欄の出現を待機...");
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 60000 });
    await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: 100 });

    console.log("5. ログイン実行...");
    await page.waitForSelector('button[name="login_step2"]', { visible: true, timeout: 60000 });
    await Promise.all([
      page.click('button[name="login_step2"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    console.log("6. VPS管理画面へ移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle0' });

    console.log("7. 更新ボタンを確認中...");
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
