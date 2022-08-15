# Code for dog experiment

The experiment can be run by opening the `task.html` file in the browser. Different paramterizations can be run by adding URL arguments, e.g.:
```
.../task.html?type=as_u&rc=.1
```

The options for learning algorithms are:
- `q` for q-learner
    - `df` discount factor (eg df=.95)
    - `lr` learning rate (eg lr=.1)
    - `rc` random choice epsilon (eg rc=.1)
    - `iq` initial q value (eg iq=0
    - `arule` action rule (eg arule=e for epsilon greedy)
- `qet` for q-learner with eligibility traces
    - `df` discount factor (eg df=.95)
    - `lr` learning rate (eg lr=.1)
    - `rc` random choice epsilon (eg rc=.1)
    - `iq` initial q value (eg iq=0)
    - `arule` action rule (eg arule=e for epsilon greedy)
- `mb` for model-based
    - `df` discount factor (eg df=.95)
    - `rc` random choice epsilon (eg rc=.1)
    - `ir` initial reward (eg ir=0)
- `as_u` for action signaling with uniform policy prior
    - `rc` random choice epsilon (eg rc=.1)
- `as_s` for action signaling with state reward policy prior
    - `rc` random choice epsilon (eg rc=.1)
