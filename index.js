const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // GitHub Actionsで動かすための必須オプション
  });
  const page = await browser.newPage();

  try {
    // 1. ログインページへアクセス
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle2' });

    // 2. ログイン実行
    await page.type('input[name="memberid"]', process.env.XSERVER_ID);
    await page.type('input[name="password"]', process.env.XSERVER_PW);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // 3. 無料VPSの管理ページへ移動
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    // 4. 「更新」ボタンを探してクリック
    // ※ボタンのテキスト「更新する」を基準に探します
    const updateButton = await page.$x("//a[contains(text(), '更新する')]");
    
    if (updateButton.length > 0) {
      await updateButton[0].click();
      console.log("✅ 更新処理を実行しました。");
      // 完了まで少し待機
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.log("ℹ️ 更新ボタンが見つかりませんでした。まだ更新期間外の可能性があります。");
    }

  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();