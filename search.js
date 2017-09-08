const Nightmare = require('nightmare');
const jquery = require('jquery');
const fs = require('fs');
const {
    csvFormat
} = require('d3-dsv');
const $ = require('cheerio');
const Linkedin = require('./plugins/linkedin.js');
const duck = require('./plugins/duck.js');
const itJobs = require('./plugins/itJobs');
const glassdoor = require('./plugins/glassdoor');

let jobs = [];

const cred = require('./credentials.json');
console.log("cred -> ", cred.user);

const email = cred.user;
const pass = cred.pass;
const job = cred.job;
const location = cred.location;

nightmare = Nightmare({
    // openDevTools: {
    //     mode: 'bottom'
    // },
    show: true,
    // pollInterval: 50, //in ms
    alwaysOnTop: false,
    title: 'JobSearchApp',
    width: 1300,
    height: 600,
    // loadTimeout: 5000, // in ms
    // executionTimeout: 5000 // in ms
});

Nightmare.action('clearCache',
    function(name, options, parent, win, renderer, done) {
        parent.respondTo('clearCache', function(done) {
            win.webContents.session.clearCache(done);
        });
        done();
    },
    function(message, done) {
        this.child.call('clearCache', done);
    });

// define glassdoor
// let glassdoor = function() {
//     console.log("==========================");
//     console.log("= SCRAPING GLASSDOOR.COM =");
//     console.log("==========================");
//     return function(nightmare) {
//         nightmare
//             .goto('https://www.glassdoor.com/Job/jobs.htm?suggestCount=0&suggestChosen=true&clickSource=searchBtn&typedKeyword=front+&sc.keyword=front+end+developer&locT=C&locId=3185896&jobType=')
//             .wait()
//             .evaluate(function() {
//                 let glassJobs = [];
//                 $('#MainCol > div > ul > li').each(function() {
//                     gb = {};
//                     gb["title"] = $(this).find("div > div > div > a").text();
//                     gb["company"] = $(this).find("div > div.flexbox.empLoc > div").text();
//                     gb["source"] = "glassdoor.com";
//                     gb["date"] = $(this).find("div > div.flexbox.empLoc > span.showHH.nowrap > span").text();
//                     gb["logo"] = $(this).find("div.logoWrap > a > span > img").attr("src");

//                     glassJobs.push(gb);
//                 });
//                 return glassJobs;
//             })

//     }
// };

// define indeed.pt
let indeed = function() {
    console.log("======================");
    console.log("= SCRAPING INDEED.PT =");
    console.log("======================");
    return function(nightmare) {
        nightmare
            .goto('https://www.indeed.pt/ofertas?q=Front+End+Developer&l=Aveiro,+Distrito+de+Aveiro')
            .inject('js', './node_modules/jquery/dist/jquery.min.js')
            .wait()
            .evaluate(function() {
                let indeedJobs = [];
                $('.result').each(function() {
                    ind = {};
                    ind["title"] = $(this).find("h2.jobtitle > a").text();
                    ind["company"] = $(this).find("span.company > span").text();
                    ind["source"] = "indeed.pt";
                    ind["date"] = $(this).find("table > tbody > tr > td > div.result-link-bar-container > div > span.date").text();
                    ind["description"] = $(this).find(".sumary").text();

                    indeedJobs.push(ind);
                });
                return indeedJobs;
            })

    }
};

// Empregosonline.pt
let empregosonline = function() {
    console.log("==============================");
    console.log("= SCRAPING EMPREGOSONLINE.PT =");
    console.log("==============================");
    return function(nightmare) {
        selector = 'pesquisaItem';
        nightmare
            .goto('http://www.empregosonline.pt/Pesquisa/Results.aspx?search=developer&cat=&zon=2')
            .inject('js', './node_modules/jquery/dist/jquery.min.js')
            .wait()
            .evaluate(function() {
                let empregosonlineJobs = [];
                $('.pesquisaItem').each(function() {
                    eo = {};
                    eo["title"] = $(this).find("h3 > a > strong").text();
                    let extractedLink = $(this).find("h3 > a").attr("href");
                    eo["link"] = "http://www.empregosonline.pt" + extractedLink;
                    eo["logo"] = $(this).find(".resultPesquisa_img > a > img").attr("src");
                    eo["company"] = $(this).find(".subInfo > a").text();
                    eo["location"] = 'Distrito de Aveiro';
                    eo["date"] = $(this).find("span:nth-child(4)").text();
                    eo["source"] = "Empregosonline.pt";
                    empregosonlineJobs.push(eo);
                });
                return empregosonlineJobs;
            })
    }
};


// emprego.pt
let emprego = function() {
    console.log("=======================");
    console.log("= SCRAPING EMPREGO.PT =");
    console.log("=======================");
    return function(nightmare) {
        selector = 'pesquisaItem';
        nightmare
            .goto('https://www.emprego.pt/jobs')
            .inject('js', './node_modules/jquery/dist/jquery.min.js')
            .wait()
            .click('body > header > nav > div > div.navbar-collapse.collapse > ul.nav.navbar-nav.navbar-right > li > button')
            .wait(5000)
            // .click('input[type="email"]')
            .type('input#auth_user_email', 'lol')
            .type('input#auth_user_password', 'Pro862486248')
            .click('#login-tab > form > button')

            .wait(5000)
            .screenshot('screenshot.png')
            .evaluate(function() {

                    let empregoJobs = [];
                    $('.pesquisaItem').each(function() {
                        eo = {};
                        eo["title"] = $(this).find("h3 > a > strong").text();
                        let extractedLink = $(this).find("h3 > a").attr("href");
                        eo["link"] = "http://www.emprego.pt" + extractedLink;
                        eo["logo"] = $(this).find(".resultPesquisa_img > a > img").attr("src");
                        eo["company"] = $(this).find(".subInfo > a").text();
                        eo["location"] = 'Distrito de Aveiro';
                        eo["date"] = $(this).find("span:nth-child(4)").text();
                        eo["source"] = "emprego.pt";
                        empregoJobs.push(eo);
                    });
                    return empregoJobs;
                },
                function() {
                    alert($("#auth_user_email"));
                })
    }
};

nightmare
    // .clearCache()

    /* itjobs.pt */
    .use(itJobs.search())
    .then((itJobs) => jobs.push(itJobs))

    /* glassdoor.com */
    .then(() => nightmare.use(glassdoor.search()))
    .then((glassdoor) => jobs.push(glassdoor))

    /* indeed.pt */
    // .then(() => nightmare.use(indeed()))
    // .then(function(indeedJobs) {
    //     jobs.push(indeedJobs);
    // })

    /* empregosonline.pt */
    // .then(() => nightmare.use(empregosonline()))
    // .then(function(empregosonlineJobs){
    //     jobs.push(empregosonlineJobs);
    // })

    /* Empregos.pt */
    // .then(() => nightmare.use(emprego()))
    // .then(function(empregoJobs) {
    //     jobs.push(empregoJobs);
    // })

    // .use(Linkedin.login(email, pass))
    // .then(function() {
    //     return nightmare.use(Linkedin.jobSearch(job, location))
    // })

    .then(function(content) {
        content = JSON.stringify(jobs).replace(/\[|\]|\\n/g, " ");
        fs.writeFile("./jobsearch.json", content, 'utf8', function(err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });

    })
    .then(() => console.log("jobs results -> ", jobs))
    .then(() => nightmare.end())
    .catch(function(error) {
        console.log(error);
    });