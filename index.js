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
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'domcontentloaded' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.type('input[name="memberid"]', process.env.XSERVER_ID);
    
    console.log("3. 『次へ』をクリック...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent.includes('次へ'));
      if (nextBtn) nextBtn.click();
    });

    console.log("4. パスワード欄が出るのを待機中...");
    // 画面遷移を待つのではなく、パスワード入力欄が出現するまで最大60秒待つ
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 60000 });
    await page.type('input[name="password"]', process.env.XSERVER_PW);

    console.log("5. ログイン実行...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.textContent.includes('ログイン'));
      if (loginBtn) loginBtn.click();
    });

    console.log("6. VPS管理画面へ移動...");
    // ログイン後のトップページが表示されるのを待ってから移動
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'domcontentloaded' });

    console.log("7. 更新ボタンを確認中...");
    await page.waitForTimeout(3000); // 念のためボタン描画を少し待つ
    const canUpdate = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const updateLink = links.find(l => l.textContent.includes('更新する'));
      if (updateLink) {
        updateLink.click();
        return true;
      }
      return false;
    });
    
    if (canUpdate) {
      console.log("✅ 更新処理を実行しました。");
      await page.waitForTimeout(5000);
    } else {
      console.log("ℹ️ 更新ボタンが見つかりません。期間外です。");
    }

  } catch (error) {
    console.error("❌ エラー:", error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
