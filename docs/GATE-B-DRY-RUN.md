# GATE-B dry run — proof the path works (synthetic data)

De-risks the proof path: when Rachel fills real numbers, the first boundary is ONE command.
Data is synthetic-realistic (`docs/first-boundary-plaster-SYNTHETIC.csv`, marked DEMO).

## Pipeline exercised
`CSV -> import_observations (contract gate) -> gate_b_dry_run (MME -> deriveBoundary -> report)`

The gate also caught a real issue mid-run: method `iso834_to_500C` was rejected as
**not commensurable** with the canonical `time_to_failure` method `EN 13381-8` — exactly the
guard that prevents aggregating incomparable measurements. Fixed to the canonical method.

## Result (what Rachel's real data will produce)
```
T_noise (MME) from 6 repeats @ density 140: mean TTF=80.5 min, sigma=1.87 min
Spec (T_relevance): PASS if TTF >= 60 min
Scan: 90->44/fail, 110->54/fail, 130->66/work, 150->80/work, 170->92/work

Derived boundary (density -> time_to_failure):
  direction:  fails_below
  boundary:   density = 120 kg/m3   interval [110,130]
  sigma(bnd): 3.12 kg/m3  (= MME / |slope 0.6|)
  95% CI:     [113.8, 126.2] kg/m3
  separable:  true   monotonic: true

Verdict: PASS — below ~120 kg/m3 char density the plaster fails the 60-min rating.
```

## Meaning
The engine recovers a correct, bracketed boundary with a commensurable uncertainty
(sigma in density units, not TTF units). The only missing inputs are REAL: Rachel's MME
repeats, the density scan, and the signed spec. Run: `node scripts/gate_b_dry_run.mjs <payload> --input density --spec <min>`.
