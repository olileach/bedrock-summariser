var modelArray = {};
var bedrockRunning = false;
const modelInput = document.getElementById("modelDataList");
const modelButton = document.getElementById("model-update")

modelInput.addEventListener("keypress", function(event) {
	if (event.key === "Enter") {
	  event.preventDefault();
	  console.log("Setting model id to " + modelInput.value);
	  setModelName();
	}
  });

modelButton.addEventListener("click", function(event){
	event.preventDefault();
	setModelName()
});

const headers = {
	'Content-Type': 'application/json'
  }

window.onload = async (event) => {
	axios.post('/api/models', {
		headers:headers,
	}).then(function (response){
		console.log(response.data);
		for (i in (response.data)){
			modelArray["models"]={
				key:i,
				value:response.data[i]
			};
			var option = document.createElement("option");
			option.text = response.data[i];
			option.value = response.data[i];
			var select = document.getElementById("datalistOptions");
			select.appendChild(option);
		}		
	});
	
	localStorage.setItem("models",modelArray);
}

function setModelName () {

	var modelName = document.getElementById("modelDataList").value;
	if (!modelName){
		if (localStorage.getItem("modelUsed")){
			modelName = localStorage.getItem("modelUsed");
		}
		else {
			modelName="anthropic.claude-v2"
		}
	}
	var select = document.getElementById("model-used");
	select.textContent = "You are currently using the "+modelName+" model";
	document.getElementById("model-form").reset();
	localStorage.setItem("modelUsed", modelName);
};

window.addEventListener("load", setModelName())