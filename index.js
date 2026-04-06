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

    console.log("2. ログイン情報を入力中...");
    // ID欄の待機と入力
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: 100 });

    // パスワード欄がすでに表示されている、またはID入力後に自動で出るのを待機
    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: 100 });

    console.log("3. ログインボタンをクリック...");
    // 「ログインする」ボタン（login_step2 または type=submit）をクリック
    const loginBtn = await page.$('button[name="login_step2"]') || await page.$('button[type="submit"]');
    
    await Promise.all([
      loginBtn.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    console.log("4. VPS管理画面へ移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    console.log("5. 更新ボタンを確認中...");
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
    console.error("❌ エラー詳細:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
