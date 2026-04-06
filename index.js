const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--lang=ja',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ]
  });
  const page = await browser.newPage();
  
  // ボット検知を避けるためのWebdriver無効化
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.setViewport({ width: 1280, height: 1024 });

  try {
    console.log("1. ログインページへ移動中...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle2' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.focus('input[name="memberid"]');
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: 200 });
    
    console.log("3. Enterキーで『次へ』を試行...");
    await new Promise(r => setTimeout(r, 1000));
    await page.keyboard.press('Enter');

    console.log("4. パスワード欄の出現を待機...");
    // 最大60秒まで待機時間を延長
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 60000 });
    
    console.log("5. パスワードを入力中...");
    await page.focus('input[name="password"]');
    await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: 200 });
    await new Promise(r => setTimeout(r, 1000));
    await page.keyboard.press('Enter');

    console.log("6. ログイン後の遷移を待機...");
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    console.log("7. VPS管理画面へ移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    console.log("8. 更新ボタンを確認中...");
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
