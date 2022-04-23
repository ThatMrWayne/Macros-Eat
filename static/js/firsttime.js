async function submit_information(){
    try{
        let response = await fetch('/api/users',{
                                     method: 'put',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.ok){ //付款完成,不論成功或失敗
            console.log(result)
            window.location.href=`/thankyou?number=${result.data.number}`
        }else if (response.status === 403){
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.reload();
        }else{
            console.log('伺服器錯誤');
        }
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    
}





window.addEventListener("load",()=>{
    let button = document.querySelector(".submit");
    button.addEventListener("click",()=>{
        submit_information();
    })
})