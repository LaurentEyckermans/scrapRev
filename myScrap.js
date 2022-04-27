const puppeteer = require("puppeteer");
const fs = require("fs");

const laurentScrap = async () => {
    let category

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
    });

    const page = await browser.newPage();

    let linksPerPages = []

    for (let r = 0; r < 2; r++) {
        let cardSelector = 1;
        let mySearch = ['pasta', 'risotto']

        switch (mySearch[r]) {
            case 'pasta':
                category = 'pastaRisotto'
                break
            case 'risotto':
                category = 'pastaRisotto'
                break
        }

        for (let i = 0; i < 2; i++) {
            await page.goto(
                `https://www.hellofresh.com/recipes/search?q=${mySearch[r]}?page=${i}`
            );
            let pageLinks = []
            for (let k = cardSelector; k < (cardSelector + 8); k++) {
                try {
                    if (r === 1) {
                        const myParent = await page.$$(`.web-1nlafhw:nth-child(${k})`)
                        const link = await myParent[0].$eval('a', element => element.href)
                        pageLinks.push(link)
                    } else {
                        const myParent = await page.$$(`div:nth-child(${k})`)
                        const link = await myParent[0].$eval('a', element => element.href)
                        pageLinks.push(link)
                    }
                } catch (error) {
                }
            }
            linksPerPages.push(pageLinks)
            cardSelector += 8
        }
    }
    
    console.log(linksPerPages)

    let arraySelector = [
        ['body', 'h1'],
        ['.dsjd', '.dsje'],
        [".fela-_1slhjvb", ".fela-_19qpnoj"],
        [".fela-_g6xips>div>", "p"],
        [".fela-_12sjl9r>div>", "p"],
        [".fela-_14dtxzo", "img"],
        ["div.fela-_1mq2bj0", "div.fela-_1qmjd6x >div"]
    ]

    let arrayStoredRecipes = []

    const myScrap = async (parentSelct, childSelct, type) => {
        try {
            const parent = await page.$$(`${parentSelct}`)
            // console.log(parentSelct.length)
            if (type != 'img') {
                const child = await parent[0].$eval(`${childSelct}`, element => element.innerText)
                return child
            }
            else {
                const child = await parent[0].$eval(`${childSelct}`, element => element.src)
                return child
            }
        } catch (error) {
            console.log('*****error')
        }
    }

    const myScrapLoop = async (parentSelct, childSelct, nbrLoop, type) => {
        let myChildren = []
        try {
            for (let i = 1; i < nbrLoop; i++) {
                const parent = await page.$$(`${parentSelct}:nth-child(${i})`)
                const child = await parent[0].$eval(`${childSelct}`, element => element.innerText)
                myChildren.push(child)
                if (type === 'ingr') {
                    const child = await parent[0].$eval(`${childSelct}`, element => element.nextElementSibling.innerText)
                    myChildren.push(child)
                }
            }
        } catch {
            console.log('****EndLoop')
            return myChildren
            // mhh je sais pas si c'est clean code d'utiliser un catch pour stopper un for x)
        }
    }


    const storeIngredients = async (arrIngr) => {
        let conditions = ["¼", "½", "¾", "⅛"]
        for (let i = 0; i < arrIngr.length; i++) {
            //conversion ounce cup 
            if (i === 0 || (i % 2) === 0) {
                let myconditions = conditions.some(el => arrIngr[i].includes(el))
                console.log("cond " + myconditions)
                let arrSplit
                if (myconditions) {
                    console.log(i)
                    arrSplit = arrIngr[i].split(" ")
                    arrIngr.splice(i, 1, arrSplit)
                } else {
                    arrSplit = arrIngr[i].split(/(\d+)/)
                }
                console.log(arrSplit)
                if (arrSplit[0] === "") {
                    arrSplit.splice(0, 1)
                    arrIngr.splice(i, 1, arrSplit)
                    console.log(arrSplit)
                }
            } else {

            }
        }
        console.log(arrIngr)
        return arrIngr
    }

    let recipeAdded = 0

    linksPerPages.forEach(() =>

        linksPerPages[0].forEach((link) => {
            if (link.includes('/recipes/')) {
                await page.goto(`${link}`)
                let myRecipeObj = {}
                myRecipeObj.scrapIdName = "hellofresh"
                myRecipeObj.category = category
                myRecipeObj.mainIngredient = null
                myRecipeObj.title = await myScrap(arraySelector[0][0], arraySelector[0][1])
                myRecipeObj.servingAmount = await myScrap(arraySelector[1][0], arraySelector[1][1])
                myRecipeObj.cookingTime = await myScrap(arraySelector[2][0], arraySelector[2][1])
                // const scrapIngredients
                myRecipeObj.ingredients = await myScrapLoop(arraySelector[3][0], arraySelector[3][1], 30, "ingr")
                // myRecipeObj.ingredients = await storeIngredients(scrapIngredients)
                myRecipeObj.instructions = await myScrapLoop(arraySelector[4][0], arraySelector[4][1], 30)
                myRecipeObj.image = await myScrap(arraySelector[5][0], arraySelector[5][1], "img")
                myRecipeObj.nutrition = await myScrap(arraySelector[6][0], arraySelector[6][1])
                arrayStoredRecipes.push(myRecipeObj)
                recipeAdded += 1;
                console.clear()
                console.log("recipeAdded: " + recipeAdded + " +/- 16")
            }
        })
    )

    fs.writeFileSync("recipeDataScraped.json", JSON.stringify(arrayStoredRecipes))
    await browser.close();
}

laurentScrap()