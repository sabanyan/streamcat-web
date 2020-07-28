describe('ライブラリテスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:8200/library');
    await page.setViewport({width: 1188, height: 856});
    await page.waitForSelector('body > .container > .row');
    await page.click('body > .container > .row');
    await page.type('.panel #login_email', 'admin@kskp.io');
    await page.type('.panel #login_password', 'adminpass');
    await page.waitForSelector('.panel > .panel-body > form > .form-group > .btn');
    await page.click('.panel > .panel-body > form > .form-group > .btn');
    await page.waitForSelector('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(1) > .\_3jGS17-IkvxBDxTn1mk_8r');
  });
  test('新しいフローの作成', async () => {
    await page.waitForSelector('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(1) > .\_3jGS17-IkvxBDxTn1mk_8r');
    await page.click('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(1) > .\_3jGS17-IkvxBDxTn1mk_8r');
    await page.waitForSelector('.modal-body > div > div > .LFQhD31Ki9Opy2yNY1NPm > .form-control');
    await page.click('.modal-body > div > div > .LFQhD31Ki9Opy2yNY1NPm > .form-control');
    await page.type('.LFQhD31Ki9Opy2yNY1NPm input', '新しいフロー');
    await page.waitForSelector('div:nth-child(1) > div > div > #add_flow > .modal-dialog > .modal-content > .modal-footer > div > .\_1pcXOU0XTeBtpEDygM7Jaj > .\_8YY5OH2X5DD461MPLljYy');
    await page.click('div:nth-child(1) > div > div > #add_flow > .modal-dialog > .modal-content > .modal-footer > div > .\_1pcXOU0XTeBtpEDygM7Jaj > .\_8YY5OH2X5DD461MPLljYy');
    await page.screenshot({
      path: '/Users/izuchy/Desktop/jest_results/new_flow.png'
    });
  });
  test('プロジェクトの新規作成', async () => {
    await page.waitForSelector('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(3) > .\_3jGS17-IkvxBDxTn1mk_8r')
    await page.click('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(3) > .\_3jGS17-IkvxBDxTn1mk_8r')
    await page.waitForSelector('div:nth-child(1) > div > div > #add_project > .modal-dialog > .modal-content > .modal-body')
    await page.click('div:nth-child(1) > div > div > #add_project > .modal-dialog > .modal-content > .modal-body')
    await page.waitForSelector('.modal-content > .modal-body > div > .LFQhD31Ki9Opy2yNY1NPm > .form-control')
    await page.click('.modal-content > .modal-body > div > .LFQhD31Ki9Opy2yNY1NPm > .form-control')
    await page.type('.LFQhD31Ki9Opy2yNY1NPm input', '新しいプロジェクト');
    await page.waitForSelector('div:nth-child(1) > div > div > #add_project > .modal-dialog > .modal-content > .modal-footer > div > .\_1pcXOU0XTeBtpEDygM7Jaj > .\_8YY5OH2X5DD461MPLljYy')
    await page.click('div:nth-child(1) > div > div > #add_project > .modal-dialog > .modal-content > .modal-footer > div > .\_1pcXOU0XTeBtpEDygM7Jaj > .\_8YY5OH2X5DD461MPLljYy')
    await page.screenshot({
      path: '/Users/izuchy/Desktop/jest_results' +
        '/new_project.png'
    });
  });
  test('フォルダの移動', async () => {
    await page.waitForSelector('.\_1EJVs29Ytm8WdbwTF-KS0q > tbody > .\_1Koxu2TOtZ11unJNTNtQQk:nth-child(1) > td > .\_3CCsifv8uhIKemgWoQVHio')
    await page.click('.\_1EJVs29Ytm8WdbwTF-KS0q > tbody > .\_1Koxu2TOtZ11unJNTNtQQk:nth-child(1) > td > .\_3CCsifv8uhIKemgWoQVHio')
    await page.screenshot({
      path: '/Users/izuchy/Desktop/jest_results/folder_move_01.png'
    });
    await page.waitForSelector('.\_1EJVs29Ytm8WdbwTF-KS0q > tbody > .\_1Koxu2TOtZ11unJNTNtQQk:nth-child(4) > td > .\_3CCsifv8uhIKemgWoQVHio')
    await page.click('.\_1EJVs29Ytm8WdbwTF-KS0q > tbody > .\_1Koxu2TOtZ11unJNTNtQQk:nth-child(4) > td > .\_3CCsifv8uhIKemgWoQVHio')
    await page.screenshot({
      path: '/Users/izuchy/Desktop/jest_results/folder_move_02.png'
    });
    await page.waitForSelector('div > div > div > .\_3OtqTgrVX7CKs32pexWz0 > .\_3CCsifv8uhIKemgWoQVHio:nth-child(3)')
    await page.click('div > div > div > .\_3OtqTgrVX7CKs32pexWz0 > .\_3CCsifv8uhIKemgWoQVHio:nth-child(3)')
    await page.screenshot({
      path: '/Users/izuchy/Desktop/jest_results/folder_move_03.png'
    });
    await page.waitForSelector('div > div > div > .\_3OtqTgrVX7CKs32pexWz0 > .\_3CCsifv8uhIKemgWoQVHio')
    await page.click('div > div > div > .\_3OtqTgrVX7CKs32pexWz0 > .\_3CCsifv8uhIKemgWoQVHio')
    await page.screenshot({
      path: '/Users/izuchy/Desktop/jest_results/folder_move_04.png'
    });
  });
});

describe('フローエディターテスト', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:8200/library');
    await page.setViewport({width: 1188, height: 856});
    await page.waitForSelector('body > .container > .row');
    await page.click('body > .container > .row');
    await page.type('.panel #login_email', 'admin@kskp.io');
    await page.type('.panel #login_password', 'adminpass');
    await page.waitForSelector('.panel > .panel-body > form > .form-group > .btn');
    await page.click('.panel > .panel-body > form > .form-group > .btn');
    await page.waitForSelector('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(1) > .\_3jGS17-IkvxBDxTn1mk_8r');
  });
  test('フローエディターの起動', async () => {
    await page.goto('http://localhost:8200/flows/1ce7d49e-5cd4-4cba-807f-3277317bd7b0', {waitUntil: 'domcontentloaded'})
    await page.setViewport({width: 1188, height: 782})
    await page.waitForSelector('._1RyK-aBwNoJ3JsuAA40Go8')
    await page.click('._1RyK-aBwNoJ3JsuAA40Go8')
    await page.waitForSelector('.AGbn3eRE593aYylsWe_-P')
    await page.click('._1RyK-aBwNoJ3JsuAA40Go8')
    await page.waitForSelector('.AGbn3eRE593aYylsWe_-P > g:nth-child(3) > g > g > .body')
    await page.click('.AGbn3eRE593aYylsWe_-P > g:nth-child(3) > g > g > .body')
    await page.waitForSelector('div > div > .\_3HqRxSAycWp2qRcVTh_jTb > .\_1BxhaTf5wvlZnIy81yyznT > .Vrl0Ao-gUOezZvbKIYnSy')
    await page.click('div > div > .\_3HqRxSAycWp2qRcVTh_jTb > .\_1BxhaTf5wvlZnIy81yyznT > .Vrl0Ao-gUOezZvbKIYnSy')
    await page.screenshot({
      path: '/Users/izuchy/Desktop/project.png'
    });
  });
});
