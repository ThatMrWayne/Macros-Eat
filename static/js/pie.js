let optionsEC={
    title: {display: true, text: "PFC percentages for CURRENT STATUS", fontSize: 35}, 
    legend: {display: true, position: "bottom"}    
}

let group = {"amount":[20,70,10],
            "category":["protein(%)","carbs(%)","fat(%)"]}
let DataEC = {
    datasets: [{
        backgroundColor:["#976fe8","#FCB524","#52C0BC"] ,
        data: group.amount,
        borderColor: "rgba(0,0,0,0.1)",
        borderWidth: "1"
    }],
    labels: group.category,
};

