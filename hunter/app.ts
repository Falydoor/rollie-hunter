const axios = require('axios');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const ses = new AWS.SES();

let getWatches = async () => {
    let res = await axios.get("https://rbeja3.a.searchspring.io/api/search/search.json?ajaxCatalog=v3&resultsFormat=native&siteId=rbeja3&domain=https%3A%2F%2Fwww.bobswatches.com%2Frolex%2Fdatejust-mens-steel_and_gold%23%2Ffilter%3Acustom_field_23%3AMens%2Ffilter%3Acustom_field_8%3A41mm%2Ffilter%3Acustom_field_5%3ASteel%242520and%2520Gold&filter.custom_field_23=Mens&filter.custom_field_8=41mm&filter.custom_field_5=Steel%20and%20Gold&bgfilter.ss_availability=in%20stock&bgfilter.ss_hierarchy=Rolex%20DateJust");
    return res.data.results.map((watch: any) => {
        return {
            id: { S: watch.id },
            desc: { S: watch.description },
            price: { N: watch.price },
            link: { S: watch.url }
        }
    });
};

let insertWatch = async (watch: any) => {
    console.log('Inserting', watch);
    dynamodb.putItem({ TableName: 'roliehunter-watches', Item: watch }).promise();
};

let getWatch = async (id: string) => {
    console.log('Getting', id);
    return dynamodb.getItem({ TableName: 'roliehunter-watches', Key: { id: id } }).promise();
};

let sendEmail = async (watch: any) => {
    return ses.sendEmail({
        Destination: {
            ToAddresses: ['mib.ftw@gmail.com']
        },
        Message: { Subject: { Data: 'New Watch!' }, Body: { Html: { Data: `<a class="ulink" href="${watch.link.S}" target="_blank">Watch ${watch.desc.S} for $${watch.price.N}</a>` } } },
        Source: 'mib.ftw@gmail.com'
    }).promise();
};

exports.handler = async event => {
    try {
        console.log('Getting watches');
        let watches = await getWatches();
        console.log('Watches', watches);
        for (let watch of watches) {
            if (watch.desc.S.includes('Black')) {
                let watchDb = await getWatch(watch.id);
                if (!watchDb.Item) {
                    await insertWatch(watch);
                    let email = await sendEmail(watch);
                    console.log('Email', email.MessageId);
                }
            }
        }
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: 'Failed to grab watches: ' + JSON.stringify(err) };
    }

    return { statusCode: 200, body: 'Watches grabbed' };
};
