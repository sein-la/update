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
    
    console.log("3. 『次へ』をクリック...");
    // ボタンクリックとEnterキーの両方を試行
    await page.keyboard.press('Enter'); 
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent.includes('次へ') || b.type === 'submit');
      if (nextBtn) nextBtn.click();
    });

    console.log("4. パスワード欄が出るのを待機中...");
    // 確実に要素が出るまで待つ
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 60000 });
    await page.type('input[name="password"]', process.env.XSERVER_PW);

    console.log("5. ログイン実行...");
    await page.keyboard.press('Enter');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.textContent.includes('ログイン'));
      if (loginBtn) loginBtn.click();
    });

    console.log("6. ログイン後の遷移を待機...");
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log("7. VPS管理画面へ移動...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    console.log("8. 更新ボタンを確認中...");
    // ボタンの描画を待つ
    await new Promise(r => setTimeout(r, 5000));
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
      await new Promise(r => setTimeout(r, 5000));
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
