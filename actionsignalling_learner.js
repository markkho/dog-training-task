
/*****************************************************
*
*  Action Signalling learner
*
******************************************************/
var ActionSignallingLearner = function(markovDecisionProblem, learningRate, randomChoose, policies, policy_probs) {
	this.learnerType = 'ActionSignallingLearner';
	this.mdp = markovDecisionProblem;
	this.randomChoose = randomChoose;
	this.learningRate = learningRate;
	this.policies = policies;
	this.policy_probs = policy_probs;
}

ActionSignallingLearner.prototype.getAction = function (state) {
	var actions = this.mdp.getAvailableActions(state);
	if (_.size(actions) == 1) {
		return actions[0]
	}
	//epsilon greedy of max marginalized action
	var action_probs = _.object(_.map(actions, function (a) {return [a, 0]}));
	for (var pi = 0; pi < this.policies.length; pi++) {
		var policy = this.policies[pi];
		action_probs[policy[state]] += this.policy_probs[pi];
	}

	var max_p = _.max(_.values(action_probs));
	var maxactions = _.filter(_.pairs(action_probs), function (a_p) {return a_p[1] == max_p});
	maxactions = _.map(maxactions, function (a_p) {return a_p[0]});
	var nonmax = _.filter(actions, function (a) {return !_.contains(maxactions, a)});

	if (Math.random() > this.randomChoose || nonmax.length == 0) {
		return _.sample(maxactions);
	}
	else {
		return _.sample(nonmax);
	}
}

ActionSignallingLearner.prototype.processResponse = function (state, action, response) {
	var reserved_pmass = .01;
	var sigmoid_param = 2;
	var normalization = 0;
	for (var pi = 0; pi < this.policies.length; pi++) {
		var policy = this.policies[pi];
		var likelihood;
		//stepwise method
		/*if (response > 0) {
			if (policy[state] == action) {
				likelihood = 1 - reserved_pmass/2;
			}
			else {
				likelihood = reserved_pmass/2;
			}
		}
		else if (response < 0) {
			if (policy[state] == action) {
				likelihood = reserved_pmass/2;
			}
			else {
				likelihood = 1 - reserved_pmass/2;
			}
		}
		else {
			likelihood = reserved_pmass;
		}*/

		//sigmoid method
		if (policy[state] == action) {
			likelihood = 1/(1+Math.exp(-sigmoid_param*response));
		}
		else {
			likelihood = 1/(1+Math.exp(sigmoid_param*response));
		}
		this.policy_probs[pi] *= likelihood;
		normalization += this.policy_probs[pi];
	}
	this.policy_probs = _.map(this.policy_probs, function (p) {return p/normalization});
};

ActionSignallingLearner.prototype.get_policy = function () {
	var max_policy_prob = _.max(this.policy_probs);
	var max_policy_ind = _.filter(_.range(this.policies.length), 
									function(i) {return this.policy_probs[i] == max_policy_prob},
									this);
	var random_max_policy = _.sample(max_policy_ind);
	return this.policies[random_max_policy]
}

ActionSignallingLearner.prototype.get_action_prob = function () {
	var expected_policy = {};
	
	for (var pi = 0; pi < this.policies.length; pi++) {
		var policy = this.policies[pi];
		var states = _.keys(policy);
		for (var s = 0; s < states.length; s++) {
			var state = states[s];
			if (!_.contains(_.keys(expected_policy), state)) {
				expected_policy[state] = {};
			}
			var action = policy[state];
			if (!_.contains(_.keys(expected_policy[state]), action)) {
				expected_policy[state][action] = 0.0;
			}
			expected_policy[state][action] += this.policy_probs[pi];
		}
	}

	return expected_policy
}

ActionSignallingLearner.prototype.getInfo = function () {
	return {'max_policy':this.get_policy()}
}