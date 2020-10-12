const puppeteer = require('puppeteer');

// 定数
const LOGIN_URL = 'localhost:8100';
const LOGIN_ADDRESS = 'admin@kskp.io';
const LOGIN_PASS = '1234';
const TARGET_URL = 'http://localhost:8100/library';
const LOGIN_ADDRESS_SELECTOR = 'input[name=email]';
const LOGIN_PASS_SELECTOR = 'input[name=password]';
const LOGIN_SUBMIT_SELECTOR = 'input[name=sumbit]';


describe("kskp", () => {
    beforeAll(async () => {
        // ブラウザを表示する？, true: ブラウザを表示しない, false: ブラウザを表示する
        const browser = await puppeteer.launch({ headless: false })


        // タブを定義
        const page = await browser.newPage();

        // ブラウザのサイズを定義
        await page.setViewport({ width: 960, height: 840 });

        // 待機
        async function sleep(delay) {
            return new Promise(resolve => setTimeout(resolve, delay));
        }

        // KSKPにアクセス
        await page.goto('localhost:8100', { waitUntil: 'domcontentloaded' });
        await page.type(LOGIN_ADDRESS_SELECTOR, LOGIN_ADDRESS);
        await page.type(LOGIN_PASS_SELECTOR, LOGIN_PASS);

        await sleep(1000);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            page.click('input[class="btn btn-primary btn-default btn-block"]'),
        ])
        // await page.click(LOGIN_SUBMIT_SELECTOR);


        // return document.getElementById("navbarUsername");
        // console.log(page.url());
        // console.log(value);
        // ログイン後の画面に移動 

        // console.log(document.getElementById("navbarUsername"));

        await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });

    });

    it('ラベルテスト', async () => {
      
        const data = await page.evaluate(() => {
            
           return document.querySelector('navUserName')
        });
        console.log(data)
    });
});
