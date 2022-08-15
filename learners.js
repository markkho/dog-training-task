/*****************************************************
*
* Model-Free Learning Algorithm (Q-learning)
*
******************************************************/
var Qlearner = function (markovDecisionProblem, discountFactor, learningRate, randomChoose, initQ, temperature, actionSelectionRule) {
	this.learnerType = 'Qlearner';
	this.discountFactor = discountFactor; //MDP discount rate (gamma)
	this.learningRate = learningRate; //Agent learning rate
	this.randomChoose = randomChoose; //Probability of choosing a level at random (i.e. the epsilon in epsilon-greedy)
	this.temperature = temperature; //temperature of softmax
	this.initQ = initQ; //initial value for Q values (will determine how agent explores, particularly in the beginning)
	this.actionSelectionRule = actionSelectionRule; //rule to use ('egreedy' or 'softmax')
	this.mdp = markovDecisionProblem;

	this.qValues = {}; //q values of learner
	var allStates = this.mdp.getAllStates()
	for (var s = 0; s < allStates.length; s++) {
		var state = allStates[s];
		var availableActions = this.mdp.getAvailableActions(state);

		this.qValues[state] = {};

		for (var a = 0; a < availableActions.length; a++) {
			var action = availableActions[a];
			if (action == '%') {
				this.qValues[state][action] = 0.0
			}
			else {
				this.qValues[state][action] = initQ;
			}
		}
	}
};

//takes in state as [x,y] list, returns an action
Qlearner.prototype.getAction = function (state) {
	var actionQs = this.qValues[state];
	var actionNames = _.keys(actionQs);

	//epsilon greedy
	if (this.actionSelectionRule == 'e') {
		var maxAction = _.max(_.shuffle(actionNames), function (a) {
			return actionQs[a]
		});
		if (Math.random() < this.randomChoose) {
			console.log('random move');
			var nonMaxActions = _.without(actionNames, maxAction);
			return _.sample(nonMaxActions);
		}
		console.log('optimal move');
		return maxAction;
	}

	//softmax
	else if (this.actionSelectionRule == 's') {
		var expVals = _.map(actionNames, function(a) {
			return Math.exp(actionQs[a]/this.temperature)
		});
		var norm = _.reduce(expVals, function(memo, num){ return memo + num; }, 0);
		var softmaxProbs = _.map(expVals, function(expVal) {
			return expVals/norm
		});
		var cumProb = 0;
		var cumProbs = _.map(softmaxProbs, function(p) {
			cumProb += p;
			return cumProb
		});

		var rand = Math.random();
		var i = 0;
		for (i = 0; i < cumProbs.length; i++) {
			if (rand < cumProbs[i]) {
				return actionNames[i]
			}
		}
	}

	//random
	else {
		return _.sample(actionNames);
	}
}

Qlearner.prototype.updateQs = function (state, action, nextState, reward) {
	var nextActionQs = this.qValues[nextState];
	var nextActionNames = _.keys(nextActionQs);
	var maxNextAction = _.max(_.shuffle(nextActionNames), function(a) {
		return nextActionQs[a]
	});
	var maxNextQ = nextActionQs[maxNextAction];

	var predError = reward + this.discountFactor*maxNextQ - this.qValues[state][action]

	console.log('Prediction Error: '+ predError.toFixed(3));

	this.qValues[state][action] += this.learningRate*(predError);
}

Qlearner.prototype.processResponse = function (state, action, response) {
	var nextState = this.mdp.getNextState(state, action);
	this.updateQs(state, action, nextState, response);
}

Qlearner.prototype.getInfo = function () {
	return {'qValues':this.qValues}
}

/*****************************************************
*
* Model-Free Learning Algorithm (Q-learning with Eligibility Trace)
*
******************************************************/
var Qlearner_w_EligibilityTrace = function (markovDecisionProblem, discountFactor, learningRate, randomChoose, initQ, temperature, actionSelectionRule, traceDecay) {
	this.learnerType = 'Qlearner';
	this.discountFactor = discountFactor; //MDP discount rate (gamma)
	this.learningRate = learningRate; //Agent learning rate
	this.randomChoose = randomChoose; //Probability of choosing a level at random (i.e. the epsilon in epsilon-greedy)
	this.temperature = temperature; //temperature of softmax
	this.initQ = initQ; //initial value for Q values (will determine how agent explores, particularly in the beginning)
	this.actionSelectionRule = actionSelectionRule; //rule to use ('egreedy' or 'softmax')
	this.traceDecay = traceDecay;
	this.mdp = markovDecisionProblem;

	this.qValues = {}; //q values of learner
	this.eligibilityTrace = {};
	var allStates = this.mdp.getAllStates()
	for (var s = 0; s < allStates.length; s++) {
		var state = allStates[s];
		var availableActions = this.mdp.getAvailableActions(state);

		this.qValues[state] = {};
		this.eligibilityTrace[state] = {};

		for (var a = 0; a < availableActions.length; a++) {
			var action = availableActions[a];
			if (action == '%') {
				this.qValues[state][action] = 0.0
				this.eligibilityTrace[state][action] = 0.0;
			}
			else {
				this.qValues[state][action] = initQ;
				this.eligibilityTrace[state][action] = 0.0;
			}
		}
	}
};

Qlearner_w_EligibilityTrace.prototype.resetEligibilityTraces = function () {
	this.eligibilityTrace = {};
	var allStates = this.mdp.getAllStates()
	for (var s = 0; s < allStates.length; s++) {
		var state = allStates[s];
		var availableActions = this.mdp.getAvailableActions(state);
		this.eligibilityTrace[state] = {};
		for (var a = 0; a < availableActions.length; a++) {
			var action = availableActions[a];
			if (action == '%') {
				this.eligibilityTrace[state][action] = 0.0;
			}
			else {
				this.eligibilityTrace[state][action] = 0.0;
			}
		}
	}
}

//takes in state as [x,y] list, returns an action
Qlearner_w_EligibilityTrace.prototype.getAction = function (state) {
	var actionQs = this.qValues[state];
	var actionNames = _.keys(actionQs);

	//epsilon greedy
	if (this.actionSelectionRule == 'e') {
		var maxAction = _.max(_.shuffle(actionNames), function (a) {
			return actionQs[a]
		});
		if (Math.random() < this.randomChoose) {
			console.log('random move');
			var nonMaxActions = _.without(actionNames, maxAction);
			return _.sample(nonMaxActions);
		}
		console.log('optimal move');
		return maxAction;
	}

	//softmax
	else if (this.actionSelectionRule == 's') {
		var expVals = _.map(actionNames, function(a) {
			return Math.exp(actionQs[a]/this.temperature)
		});
		var norm = _.reduce(expVals, function(memo, num){ return memo + num; }, 0);
		var softmaxProbs = _.map(expVals, function(expVal) {
			return expVals/norm
		});
		var cumProb = 0;
		var cumProbs = _.map(softmaxProbs, function(p) {
			cumProb += p;
			return cumProb
		});

		var rand = Math.random();
		var i = 0;
		for (i = 0; i < cumProbs.length; i++) {
			if (rand < cumProbs[i]) {
				return actionNames[i]
			}
		}
	}

	//random
	else {
		return _.sample(actionNames);
	}
}

Qlearner_w_EligibilityTrace.prototype.updateQs = function (state, action, nextState, reward) {
	var nextActionQs = this.qValues[nextState];
	var nextActionNames = _.keys(nextActionQs);
	var maxNextAction = _.max(_.shuffle(nextActionNames), function(a) {
		return nextActionQs[a]
	});
	var maxNextQ = nextActionQs[maxNextAction];

	var predError = reward + this.discountFactor*maxNextQ - this.qValues[state][action]
	console.log('Prediction Error: '+ predError.toFixed(3));

	//update eligibility traces
	var orig_trace_val = this.eligibilityTrace[state][action] + 1;
	var replacement_actions = this.mdp.getAvailableActions(state);
	for (var ra = 0; ra < replacement_actions.length; ra++) {
		this.eligibilityTrace[state][replacement_actions[ra]] = 0;
	}
	//this.eligibilityTrace[state][action] = orig_trace_val; //cumulating trace
	this.eligibilityTrace[state][action] = 1; //replacement trace


	//all states
	var allStates = this.mdp.getAllStates()
	for (var s = 0; s < allStates.length; s++) {
		var temp_state = allStates[s];
		var availableActions = this.mdp.getAvailableActions(temp_state);
		for (var a = 0; a < availableActions.length; a++) {
			var temp_action = availableActions[a];
			//update q values
			this.qValues[temp_state][temp_action] += this.learningRate*predError*this.eligibilityTrace[temp_state][temp_action];
			this.eligibilityTrace[temp_state][temp_action] *= this.discountFactor*this.traceDecay;
		}
	}
}

Qlearner_w_EligibilityTrace.prototype.processResponse = function (state, action, response) {
	var nextState = this.mdp.getNextState(state, action);
	this.updateQs(state, action, nextState, response);
}

Qlearner_w_EligibilityTrace.prototype.getInfo = function () {
	return {'qValues':this.qValues}
}

/*****************************************************
*
* Model-Based Learning Algorithm
*
******************************************************/
var ModelBasedLearner = function(markovDecisionProblem, discountFactor, learningRate, randomChoose, initReward) {
	this.learnerType = 'ModelBasedLearner';
	this.discountFactor = discountFactor;  //discount factor for finding optimal policy
	this.randomChoose = randomChoose; //probability of not choosing the optimal action
	this.initReward = initReward; //initial rewards in reward function
	this.learningRate = learningRate;
	this.mdp = markovDecisionProblem; //mdp

	this.rewardFunction = {};
	this.transitionFunction = {};
	this.optimalPolicy = {};
	this.valueFunction = {};

	//set up reward function, empty optimal policy, and transition function
	var allStates = this.mdp.getAllStates();
	for (var s = 0; s < allStates.length; s++) {
		var state = allStates[s];
		var availableActions = this.mdp.getAvailableActions(state);

		this.rewardFunction[state] = {};
		this.transitionFunction[state] = {};
		this.optimalPolicy[state] = _.sample(this.mdp.getAvailableActions(state));
		this.valueFunction[state] = 0.0;

		for (var a = 0; a < availableActions.length; a++) {
			var action = availableActions[a];
			if (action == '%') {
				this.rewardFunction[state][action] = 0.0
			}
			else {
				this.rewardFunction[state][action] = this.initReward;
			}
			this.transitionFunction[state][action] = this.mdp.getNextState(state, action);
		}
	}
}

ModelBasedLearner.prototype.calcOptimalPolicy = function (maxIterations) {
	var valueFunction = this.valueFunction;

	var transitionFunction = this.transitionFunction;
	var rewardFunction = this.rewardFunction;
	var discountFactor = this.discountFactor;

	//new policy optimizer
	var states = this.mdp.getAllStates();
	var episodeLength = 100;
	var valueFunction = this.valueFunction;
	var optimalPolicy = this.optimalPolicy;
	var mdp = this.mdp;
	var discountFactor = this.discountFactor;
	var cachedPolicies = [];
	var revisitedPolicies = [];
	for (var i = 0; i < maxIterations; i++) {
		var policyChanged = false;
		//policy improvement step - for each state, update the policy st you're choosing the max action

		for (var s = 0; s < states.length; s++) {
			var state = states[s];
			var actions = mdp.getAvailableActions(state);
			var actionVals = {};
			var tempPolicy = _.clone(optimalPolicy);
			for (var a = 0 ; a < actions.length; a++) {
				var action = actions[a];

				var stepState = state;
				tempPolicy[state] = action;
				actionVals[action] = 0.0;

				//simulate future rewards using this slightly modified policy
				for (var step = 0; step < episodeLength; step++) {
					var stepAction = tempPolicy[stepState];
					var reward = rewardFunction[stepState][stepAction];
					actionVals[action] += reward*Math.pow(discountFactor,step);
					stepState = mdp.getNextState(stepState, stepAction); //next state
				}
			}
			var maxVal = _.max(_.values(actionVals));
			var maxAction = _.max(actions, function (a) {
				return actionVals[a];
			});

			var curPolicy = _.values(optimalPolicy).join('');
			//console.log(curPolicy + ' - ' + state + ', curAct: ' + optimalPolicy[state] + ', maxAct: ' + maxAction + ', maxVal :' + maxVal.toFixed(1))

			if (optimalPolicy[state] != maxAction) {
				optimalPolicy[state] = maxAction;
				policyChanged = true;
			}
		}
		if (_.contains(cachedPolicies, _.values(optimalPolicy).join(''))) {
			//console.log('foundcached: ' + i + ' iterations');
			revisitedPolicies.push(JSON.stringify(optimalPolicy));
		}
		else {
			cachedPolicies.push(_.values(optimalPolicy).join(''));
		}

		if (_.contains(revisitedPolicies, JSON.stringify(optimalPolicy))) {
			//once maximal policies have been revisited twice, randomly choose one
			optimalPolicy = JSON.parse(_.sample(revisitedPolicies));
			//console.log('policy iteration: ' + i + ' iterations')
			break
		}
	}

	//update value function
	for (var s = 0; s < states.length; s++) {
		var state = states[s];
		var curState = state;
		valueFunction[state] = 0.0;
		for (var step = 0; step < episodeLength; step++) {
			var action = optimalPolicy[curState];
			var reward = rewardFunction[curState][action];
			valueFunction[state] += reward*Math.pow(discountFactor,step);
			curState = mdp.getNextState(curState, action); //next state
		}
	}
}

ModelBasedLearner.prototype.updateRewardFunction = function (state, action, reward) {
	this.rewardFunction[state][action] += this.learningRate*(reward-this.rewardFunction[state][action]);
};

ModelBasedLearner.prototype.getAction = function (state) {
	var optimalAction = this.optimalPolicy[state];

	if (Math.random() < this.randomChoose) {
		console.log('random move');
		var actionNames = _.keys(this.transitionFunction[state]);
		var nonMaxActions = _.without(actionNames, optimalAction);
		return _.sample(nonMaxActions)
	}
	console.log('optimal move');
	return optimalAction
}

ModelBasedLearner.prototype.processResponse = function (state, action, response) {
	this.updateRewardFunction(state, action, response);
	this.calcOptimalPolicy(100);
};

ModelBasedLearner.prototype.getInfo = function () {
	return {'rewardFunction':this.rewardFunction}
}
