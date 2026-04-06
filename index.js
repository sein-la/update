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
  await page.setViewport({ width: 1280, height: 1024 });

  try {
    console.log("1. ログインページへ移動中...");
    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xserver/', { waitUntil: 'networkidle0' });

    console.log("2. 会員IDを入力中...");
    await page.waitForSelector('input[name="memberid"]', { visible: true });
    await page.type('input[name="memberid"]', process.env.XSERVER_ID, { delay: 100 });
    
    console.log("3. 全ボタンを走査して『次へ』をクリック...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
      const target = buttons.find(b => b.textContent.includes('次へ') || b.value?.includes('次へ'));
      if (target) {
        target.click();
      } else {
        // ボタンが見つからない場合はフォームを強制送信
        document.querySelector('form').submit();
      }
    });

    console.log("4. パスワード欄の出現を待機...");
    // 待機時間を少し短くし、失敗時にすぐ次の処理へ回せるようにします
    await page.waitForSelector('input[name="password"]', { visible: true, timeout: 30000 });
    await page.type('input[name="password"]', process.env.XSERVER_PW, { delay: 100 });

    console.log("5. ログイン実行...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'));
      const target = buttons.find(b => b.textContent.includes('ログイン') || b.value?.includes('ログイン'));
      if (target) {
        target.click();
      } else {
        document.querySelector('form').submit();
      }
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

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
