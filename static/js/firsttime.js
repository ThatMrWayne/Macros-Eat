//送出更新資料
async function submit_information(payload,jwt){
    try{
        let response = await fetch('/api/users',{
                                     method: 'put',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.ok){ //更新會員資料完成
            console.log(result); 
            //要查看header裡有沒有新的JWT,如果有就把舊的刪掉換成新的
            let test = [];
            for(let key of response.headers.keys()) {
                if(key === "access_token"){
                    response.headers.forEach(function(o){test.push(o)});
                    localStorage.removeItem('JWT');
                    localStorage.setItem('JWT',test[0]);
                }
            }
            //這時候也得到新的cookie(remind=yes)
            window.location.replace('/record') //轉到紀錄主畫面
        }else if (response.status === 403){
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if (response.status === 400){
            console.log(result)
        }else{
            console.log(result);
        }
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    
}

//產生提示訊息
function show_tip(message,attr){
    const tip = document.querySelector('.tip');
    if(tip){
        document.documentElement.style.setProperty('--color',"none");
        tip.remove();
    }
    let div = document.createElement("div");
    div.appendChild(document.createTextNode(message));
    div.classList.add("tip");
    let span = document.querySelector(attr);
    span.after(div);
    document.documentElement.style.setProperty('--color',"#F0754F");
}

//檢查表單的資料
function validate_form(){
    let age = document.getElementById("age");
    let height = document.getElementById("height");
    let weight = document.getElementById("weight");
    let result = true;
    if(!age.value || !Number(age.value)){
        show_tip('Enter a valid age','.age');
        result = false;
        return result;
    }else if(Number(age.value)<13 || Number(age.value)>80){
        show_tip('Between 13 and 80','.age');
        result = false;
        return result;
    }else if(!height.value || !Number(height.value) || Number(height.value)<30 || Number(height.value)>230){
        show_tip('Enter a valid height','.height');
        result = false;
        return result;
    }else if(!weight.value || !Number(weight.value) || Number(weight.value)<30 || Number(height.value)>500){
        show_tip('Enter a valid weight','.weight');
        result = false;
        return result;
    }
    return result
}


//組織表單資料成json檔
function organize_form(){
    let formdata = new FormData(document.querySelector('.form'));
    let data={}
    for(let pair of formdata.entries()){
        if(pair[0]==='age'){
            let n = Math.round(Number(pair[1]));
            data[pair[0]]=n;
        }else if(pair[0]==='weight' || pair[0]==='height'){
            let n  = Number(Number(pair[1]).toFixed(1));
            data[pair[0]]=n;
        }else{
            data[pair[0]]=Number(pair[1]);
        };
    };
    console.log(data);
    return JSON.stringify(data)
}
