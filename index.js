const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--lang=ja',
      '--disable-blink-features=AutomationControlled', // 自動操作フラグを隠す
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ]
  });
  const page = await browser.newPage();
  
  // 自動操作判定（navigator.webdriver）を無効化
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
    // 人間らしいランダムな打鍵速度
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: Math.floor(Math.random() * 100) + 100 });
    
    console.log("3. 『次へ』を確実に実行...");
    await new Promise(r => setTimeout(r, 2000)); // 読み込み待ち

    // ボタンの座標を取得して物理的にクリック
    const nextBtn = await page.$('button[name="login_step1"]');
    if (nextBtn) {
      await nextBtn.click({ delay: Math.floor(Math.random() * 200) + 100 });
    } else {
      await page.keyboard.press('Enter');
    }

    console.log("4. パスワード欄の出現を待機...");
    // 待機に失敗した場合は画面内のテキストをログに出して原因を特定する
    try {
      await page.waitForSelector('input[name="password"]', { visible: true, timeout: 60000 });
    } catch (e) {
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log("--- 現在の画面テキスト ---");
      console.log(bodyText.substring(0, 300));
      throw new Error("パスワード入力欄が表示されませんでした。");
    }

    console.log("5. パスワードを入力中...");
    await page.focus('input[name="password"]');
    await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: Math.floor(Math.random() * 100) + 100 });
    await new Promise(r => setTimeout(r, 1500));

    const loginBtn = await page.$('button[name="login_step2"]');
    if (loginBtn) {
      await Promise.all([
        loginBtn.click({ delay: 100 }),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
    } else {
      await Promise.all([
        page.keyboard.press('Enter'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
    }

    console.log("6. VPS管理画面へ移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

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
