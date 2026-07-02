# Reality Architecture

- Client: submits commands and displays predictions.
- Server: confirms the official world snapshot.
- RSR: calculates movement and collision.
- AAF: validates the player-to-character relationship.
- RFE: records tick evidence.
- RBF: stores isolated recovery candidates.
- Gateway: exposes runtime lifecycle actions.

The official State Root always comes from the server RSR instance.