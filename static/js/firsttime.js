//send updated data
async function submit_information(payload,jwt){
    try{
        let response = await fetch('/api/users',{
                                     method: 'put',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.ok){ 
            //check if new JWT in header(switch old one if existed)
            let test = [];
            for(let key of response.headers.keys()) {
                if(key === "access_token"){
                    response.headers.forEach(function(o){test.push(o)});
                    localStorage.removeItem('JWT');
                    localStorage.setItem('JWT',test[0]);
                }
            }
            //get new cookie at this moment (remind=yes)
            window.location.replace('/record')
        }else if (response.status === 403){
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if (response.status === 400){
            console.log(result);
        }else{
            console.log(result);
        }
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    
}

//show reminder tip
function show_tip(message,attr){
    const tip = document.querySelector('.tip');
    if(tip){
        document.documentElement.style.setProperty('--color',"none");
        tip.remove();
    };
    let div = document.createElement("div");
    div.appendChild(document.createTextNode(message));
    div.classList.add("tip");
    let span = document.querySelector(attr);
    span.after(div);
    document.documentElement.style.setProperty('--color',"#F0754F");
};

//check data in form
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
    };
    return result;
};


//organize data from form to json file
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
    return JSON.stringify(data);
};
