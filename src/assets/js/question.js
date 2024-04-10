var bedrockRunning = false;
const questionResults = document.getElementById("questionResults");
const questionInput = document.getElementById("questionInput");
const questionButton = document.getElementById("questionButton");

questionInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
	console.log("Passing in " + questionInput.value + " to Bedrock.")
    texter(questionInput.value);
  }
});

questionButton.addEventListener("click", function(event) {
	event.preventDefault();
	console.log("Passing in " + questionInput.value + " to Bedrock.");
	texter(questionInput.value);
});

const texter = (text_input) => {
	if (bedrockRunning) return;
	bedrockRunning = true;
	questionResults.setAttribute("hidden", true);
	document.getElementById("progress-bar").removeAttribute("hidden");
	document.getElementById("progress-text").removeAttribute("hidden");
	const headers = {
		'Content-Type': 'application/json',
		'X-Model-Name': localStorage.getItem("modelTextUsed")
	};
	axios.post('/api/question', text_input, {
		headers:headers,
		}).then(function (response) {
			console.log(response.data);
			var str = response.data;
			const lines = (String(str).match(/\n/g) || '').length + 3;
			questionResults.removeAttribute("hidden");
			questionResults.setAttribute("rows", lines); // for firefox
			questionResults.rows = lines; // for chrome 
			document.getElementById("progress-bar").setAttribute("hidden", true);
			document.getElementById("progress-text").setAttribute("hidden", true); // write code to deal with all progress-bar
			questionResults.textContent = response.data;
			bedrockRunning = false;
			
		})
		.catch(function (error) {
			console.log(error);
	});
}

window.addEventListener("load",()=>{
	var modelName = localStorage.getItem("modelTextUsed")
	if (!modelName){
		modelName="anthropic.claude-v2"}
		localStorage.setItem("modelTextUsed", modelName)
	var select = document.getElementById("model-used");
	select.textContent = "You are currently using the "+modelName+" model";
} )
;