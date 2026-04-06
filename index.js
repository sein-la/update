const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  // 画面のサイズを大きくして要素を見つけやすくする
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log("1. ログインページへ移動中...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle0' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.type('input[name="memberid"]', process.env.XSERVER_ID);
    
    console.log("3. 『次へ』をクリック中...");
    // buttonタグの中から「次へ」という文字を持つものをクリック
    await Promise.all([
      page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nextBtn = btns.find(b => b.textContent.includes('次へ'));
        if (nextBtn) nextBtn.click();
      }),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    console.log("4. パスワードを入力中...");
    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', process.env.XSERVER_PW);

    console.log("5. ログイン実行中...");
    await Promise.all([
      page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const loginBtn = btns.find(b => b.textContent.includes('ログイン'));
        if (loginBtn) loginBtn.click();
      }),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    console.log("6. VPS管理画面へ移動中...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle0' });

    console.log("7. 更新ボタンをチェック中...");
    // リンクの中から「更新する」という文字を持つものを探す
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
      await new Promise(r => setTimeout(r, 5000)); // 完了待機
    } else {
      console.log("ℹ️ 更新ボタンが見つかりませんでした。まだ更新期間外です。");
    }

  } catch (error) {
    console.error("❌ エラーが発生しました:", error.message);
    // エラー時の画面をログに残す（デバッグ用）
    await page.screenshot({ path: 'error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
