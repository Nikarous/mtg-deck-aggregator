'use strict';
const fetch = require('node-fetch');


module.exports.mtgAggregate = async (event) => {
  const deckData = parseDeckData(event.body);
  const promiseCardData = deckData.map((card) => getCardData(card.name));
  const cardData = await Promise.all(promiseCardData);
  const stockWithPrices = 
    cardData
    .map((data) => extractAndSortCardsPrices(data))
    .flat();
  const combinedData = {
    deckData: deckData,
    stockData: stockWithPrices
  }
  const niceLookingData = makeDataLooksNice(combinedData);

  const result = {
    deckPrice: calculateCost(niceLookingData),
    cards: niceLookingData
  }


  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

const makeDataLooksNice = (data) => {
  const deck = data.deckData;
  const stockAll = data.stockData;
  
  const niceData = deck.map((neededCard) => {
    console.info("Needed Card:", neededCard)
    const cardStock = stockAll.filter((element) => element.name.includes(neededCard.name))
    console.info("Card Stock:", cardStock)
    const copyCardStock = [...cardStock];
    let cardPrice = 0;
    let fulfilled = false;
    let qty = neededCard.qty;

    while (!fulfilled) {
      if (!copyCardStock.length) {
        break;
      } 

      const tempStock = copyCardStock.pop();
      console.log("Qty:", qty);
      console.log("Card Price:", cardPrice)
      if (qty <= tempStock.stock) {
        cardPrice += (qty * tempStock.price);
        fulfilled = true;
      } else {
        cardPrice += (tempStock.stock * tempStock.price);
        qty -= tempStock.stock
        fulfilled = false;
      }
    }
    
    const result = {
        ...neededCard,
        isAvailable: fulfilled,
        price: cardPrice,
        stock: cardStock
    }

    console.warn("RESULT:", result)
    return result;
  })

  return niceData;
}

const calculateCost = (data) => {
  const value = data.reduce((acu, current, index) => {
    console.log("Acumulator:", acu);
    console.log("Current:", current);
    if (index === 1) return acu.price + current.price;
    return acu + current.price;
  });
  return value.toFixed(2);
}

const prepareWholeDeckCart = (data) => {
  const deck = data.deckData;
  const stock = data.stockData;

}

const getCardData = async (cardName) => {
  const baseUrl = "https://mtgspot.cn-panel.pl/products?limit=1000&offset=0&s_title=";
  let response = await fetch(baseUrl+cardName);
  let cards = await response.json();
  return cards.data;
}

const extractAndSortCardsPrices = (cardsData) => {
  const mappedData = cardsData.map((card) => {
    const cardDetails = {
      name: card.title,
      isFoil: card.is_foil,
      price: Number.parseFloat(card.price),
      stock: card.stock
    };
    return cardDetails;
  });

  const filteredData = mappedData.filter((card) => card.stock > 0 && !card.name.includes("Art Series"));
  const sortedData = filteredData.sort((a,b) => b.price - a.price);
  return sortedData;
}

const parseDeckData = (deckData) => {
  const cards = deckData.trim().split(/\r\n|\n/);
  const transformedCards = cards.map((card) => {
    const nameOfCard = card.slice(2).trim();
    const numberOfCards = card.slice(0, 2).trim();
    const tranfromedDetails = {
      qty: Number.parseInt(numberOfCards),
      name: nameOfCard
    };
    return tranfromedDetails;
  }); 

  const onlyCards = transformedCards.filter((card) => Number.isInteger(card.qty));
  return onlyCards;
}
 