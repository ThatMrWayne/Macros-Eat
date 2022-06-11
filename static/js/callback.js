async function get_google_jwt(data){
    try{
        let response = await fetch('/token',{
                                    method: 'post',
                                    body: data,
                                    headers: { 'Content-Type': 'application/json'}
                                        });
        let result = await response.json();                                
        if(response.ok){  
                //store JWT in local storage(response headers object is iterable object)
                let test = [];
                response.headers.forEach(function(o){test.push(o)});
                localStorage.setItem('JWT',test[0]);
                window.location.href="/record"
        }else if(response.status === 400){ 
                console.log(result.message)
        }else if(response.status === 500){ 
                console.log(result.message)
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    } 
};

window.addEventListener("load",function(){
    let email = document.getElementById("email").textContent;
    let initial = document.getElementById("initial").textContent;
    let data = {"email":email,"initial":Number(initial)}
    let req = JSON.stringify(data)
    get_google_jwt(req);
});