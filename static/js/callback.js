async function get_google_jwt(data){
    try{
        let response = await fetch('/token',{
                                    method: 'post',
                                    body: data,
                                    headers: { 'Content-Type': 'application/json'}
                                        });
        let result = await response.json();                                
        if(response.ok){  //200情況下 
                //把登入成功得到的JWT 存在local storage,這邊要注意的是,fetch回來的response headers object
                //是iterable 物件,無法直接像plain object取得裡面的東西,要用迭代的方式取得
                let test = [];
                response.headers.forEach(function(o){test.push(o)});
                localStorage.setItem('JWT',test[0]);
                window.location.href="/record"
        }else if(response.status === 400){ 
                console.log(result.message)
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
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