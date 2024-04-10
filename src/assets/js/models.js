var modelArray = {};
var bedrockRunning = false;
const modelInput = document.getElementById("modelDataList");
const modelButton = document.getElementById("model-update")

// Input field keypress enter event
modelInput.addEventListener("keypress", function(event) {
	if (event.key === "Enter") {
	  event.preventDefault(); // stops page from refreshing on click / button press
	  console.log("Setting model id to " + modelInput.value);
	  setModelName();
	}
  });

// Button click event
modelButton.addEventListener("click", function(event){
	event.preventDefault(); // stops page from refreshing on click / button press
	console.log("Setting model id to " + modelInput.value);
	setModelName()
});

// Setting headers for POST request below
const headers = {
	'Content-Type': 'application/json'
  }

// This loads the input box with Bedrock Foudnational models to choose from.
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
	
	// Potenital to use localStorage in case of performance on loading datalist field in models input. 
	//localStorage.setItem("models",modelArray);  
}

// // Function to set model name. This could be tidied up a bit.
function setModelName () {

	var modelName = document.getElementById("modelDataList").value;
	if (!modelName){
		if (localStorage.getItem("modelTextUsed")){
			modelName = localStorage.getItem("modelTextUsed");
		}
		else {
			modelName="anthropic.claude-v2";
			localStorage.setItem("modelTextUsed", modelName);
		}
	}
	var select = document.getElementById("model-used");
	select.textContent = "You are currently using the "+modelName+" model";
	document.getElementById("model-form").reset();
	localStorage.setItem("modelTextUsed", modelName);
};

// Update model list on page load.
window.addEventListener("load", setModelName())