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
    await page.type('input[name="memberid"]', process.env.XSERVER_ID);
    
    // ID入力後にEnterを押して次へ進む（ボタンを特定せずに進める方法）
    await page.keyboard.press('Enter');

    console.log("3. パスワード欄の出現を待機...");
    // ボタンのクリックを待たず、パスワード入力欄が出るのを直接待つ
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 30000 });
    await page.type('input[name="password"]', process.env.XSERVER_PW);
    await page.keyboard.press('Enter');

    console.log("4. ログイン後の遷移を待機...");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    console.log("5. VPS管理画面へ直接移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    console.log("6. 更新ボタンをスキャン中...");
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
