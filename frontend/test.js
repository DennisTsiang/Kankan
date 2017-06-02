function test(){
  var firstName = "xx";
var lastName  = "xy";
var phone     = "xz";
var adress    = "x1";
var obj = {"firstName":firstName, "lastName":lastName, "phone":phone, "address":adress};



document.getElementById('beans').innerHTML=(JSON.stringify(obj));
}
