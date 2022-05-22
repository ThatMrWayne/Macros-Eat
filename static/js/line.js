//setup block 
let dataLI = {
    datasets: [{
        data: [

        ],
        fill: true,
        borderColor: 'rgb(75, 192, 192)',
        //tension: 0.1,
        //xAxisID: 'xAxis'
    }],
};

//config block
let weight_config = {
    type : 'line',
    data : dataLI,
    options: {
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "day"
                    },
                    ticks: {
                        autoSkip: true,
                        //maxTicksLimit: 8
                    },
                    title: {
                        display: true,
                        text: "Day",
                        font : {
                            size : 24
                        }
                    }
                },
                y: {
                    suggestedMin: 0,
                    suggestedMax: 150,
                    title: {
                        display: true,
                        text: "Weight (kg)",
                        font : {
                            size : 20
                        }
                    }
                }
            },
            plugins : {
                legend  : {
                    display : false
                }
            }

            
    }
}



