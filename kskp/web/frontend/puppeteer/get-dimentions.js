const puppeteer = require('puppeteer');

// 定数
const LOGIN_URL = 'localhost:2300';
const LOGIN_ADDRESS = 'admin@kskp.io';
const LOGIN_PASS = 'administrator';
const TARGET_URL = 'http://localhost:2300/library';
const LOGIN_ADDRESS_SELECTOR = 'input[name=email]';
const LOGIN_PASS_SELECTOR = 'input[name=password]';
const LOGIN_SUBMIT_SELECTOR = 'input[name=sumbit]';


(async function main() {
  const browser = await puppeteer.launch({ headless: false });
  const [page] = await browser.pages();
  try {

    await page.goto('localhost:2300', {waitUntil: 'domcontentloaded'});
    await page.type(LOGIN_ADDRESS_SELECTOR, LOGIN_ADDRESS);
    await page.type(LOGIN_PASS_SELECTOR, LOGIN_PASS);




    async function sleep(delay) {
      return new Promise(resolve => setTimeout(resolve, delay));
    } 


    const dimensions = await page.evaluate(() => {
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        deviceScaleFactor: window.devicePixelRatio
      };
    });
    const selectVal = await page.evaluate(() => {
      return document.getElementById("login_email").placeholder;
    })
    console.log(page.url())
    console.log("selectVal ", selectVal)
  
    console.log('Dimensions:', dimensions);



    await Promise.all([
        page.waitForNavigation({waitUntil: 'domcontentloaded'}),
        page.click('input[class="btn btn-primary btn-default btn-block"]'),
    ])
    // await page.click(LOGIN_SUBMIT_SELECTOR);




    await page.goto('http://localhost:2300/library', {waitUntil: 'networkidle2'});
    
    console.log(page.url());
    console.log(typeof page.url());

    await page.screenshot({
      path: './' +
      '/library.png'
    });


    await page.waitForSelector('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(7) > .\_3jGS17-IkvxBDxTn1mk_8r', {visible: true})
    
    await page.click('div > div > .ajZP-BnWgu9AcYTVdNRXl > .oOYJEin-Ae_Rt5Xd_VOHG:nth-child(7) > .\_3jGS17-IkvxBDxTn1mk_8r')
    await sleep(1000)
    // await page.waitForSelector('div:nth-child(1) > div > div > #add_frame > .modal-dialog > .modal-content > .modal-header > .modal-title')
    // await page.click('div:nth-child(1) > div > div > #add_frame > .modal-dialog > .modal-content > .modal-header > .modal-title')
    
    // await page.waitForSelector('div:nth-child(1) > div > div > #add_frame > .modal-dialog > .modal-content > .modal-header > .modal-title')
    // await page.click('div:nth-child(1) > div > div > #add_frame > .modal-dialog > .modal-content > .modal-header > .modal-title')
    

    // const val = page.on('dialog', async dialog => {b
    //   // await dialog.accept();
    //   console.log(dialog.message());
    // })
    // console.log(val);

    console.log("checkout")
    console.log(page.url())
    await page.screenshot({
      path: './' +
      '/new_project.png'
    });
    

    await page.goto('http://localhost:2300/flows/c9b8cffb-ecf3-42bd-af65-dd48d05233ed', {waitUntil: 'networkidle2'});
    await sleep(1000)
    console.log("ranodmd")
    console.log(page.url())
    // const is_disabled2 = await page.evaluate(() => {
    //   // return document.getElementsByClassName("_3HqRxSAycWp2qRcVTh_jTb");
    //   return document.getElementByid("default-shadow");
    //   // return 123
    // })
    // const is_disabled = await page.$eval('button[disabled]', button => button !== null).catch(error => error.toString() !== 'Error: Error: failed to find element matching selector "button[disabled]"');
    // console.log(is_disabled)
    // console.log(is_disabled2)

    const getErrMsg = await page.evaluate(() => {
      return document.getElementById("default-shadow").x
    });
    console.log("before");
    console.log(getErrMsg);

    await page.goto('http://localhost:2300/library', {waitUntil: 'networkidle2'});
    await page.close();
    await browser.close();
  } catch (err) {
    // console.error(err);
    console.log("out!!!!!!!!!!!!!!!!!!");
    await page.goto('http://localhost:2300/library', {waitUntil: 'networkidle2'});
    await page.close();
    await browser.close();
  }
})();