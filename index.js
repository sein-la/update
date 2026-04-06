const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // 1. ログインページへアクセス
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle2' });

    // 2. 会員IDを入力
    await page.waitForSelector('input[name="memberid"]');
    await page.type('input[name="memberid"]', process.env.XSERVER_ID);
    
    // 3. 「次へ」ボタンをクリック（名前属性で指定）
    await Promise.all([
      page.click('button[name="login_step1"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // 4. パスワード入力欄が表示されるまで待機して入力
    await page.waitForSelector('input[name="password"]', { visible: true });
    await page.type('input[name="password"]', process.env.XSERVER_PW);

    // 5. ログイン実行（確定ボタンをクリック）
    await Promise.all([
      page.click('button[name="login_step2"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // 6. 無料VPSの管理ページへ移動
    await page.goto('https://secure.xserver.ne.jp/xapanel/xserver/vps/free_vps/list', { waitUntil: 'networkidle2' });

    // 7. 「更新する」ボタンを探してクリック
    const updateButton = await page.$x("//a[contains(text(), '更新する')]");
    
    if (updateButton.length > 0) {
      await updateButton[0].click();
      console.log("✅ 更新処理を実行しました。");
      await new Promise(r => setTimeout(r, 5000));
    } else {
      console.log("ℹ️ 更新ボタンが見つかりませんでした。まだ更新期間外です。");
    }

  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
