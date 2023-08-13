# Deciduous
A web app that simplifies building decision trees to model adverse scenarios. Hosted at https://www.deciduous.app/

It allows you to document your assumptions about how a system, service, app, etc. will respond to adverse events. Its heritage is in helping defenders anticipate attacker behavior and prepare mitigations accordingly, but it also applies to anticipating reliability-related failures, too.

It is especially useful as a foundation to conduct resilience stress testing / chaos experimentation, allowing you to continually refine your mental models of a system with reality. It prompts you to consider your beliefs about how failure can unfold across your system, which can inform design improvements to better sustain resilience to failure scenarios.

How to / getting started guide: https://kellyshortridge.com/blog/posts/deciduous-attack-tree-app/

Theme options include:
- `theme: default` - the default tree styling
- `theme: accessible` - for more color differentiation between attack and mitigation nodes
- `theme: classic` - classic Graphviz styling


## Examples
Find example trees for #inspo in [/examples](https://github.com/rpetrich/deciduous/tree/examples/examples).

#### Security
* [S3 Bucket with Video Recordings](https://github.com/rpetrich/deciduous/blob/examples/examples/s3-bucket-video-recordings.yaml)
* [Cryptominer in a Container](https://github.com/rpetrich/deciduous/blob/examples/examples/cryptominer-in-container.yaml) ([video explanation](https://youtu.be/oJ3iSyhWb5U?t=460))

#### Reliability
* [Missing Logs](https://github.com/rpetrich/deciduous/blob/examples/examples/missing-logs.yaml) ([video explanation](https://www.youtube.com/watch?v=DGdtfB1eY98))
* [Unrealistic Traces](https://github.com/rpetrich/deciduous/blob/examples/examples/unrealistic-traces.yaml)

#### Surrealism
* [Thanksploitation](https://github.com/rpetrich/deciduous/blob/examples/examples/thanksploitation.yml) scenario from Rick and Morty ([blog post](https://kellyshortridge.com/blog/posts/rick-morty-thanksploitation-decision-tree/)