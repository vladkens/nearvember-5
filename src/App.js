import "regenerator-runtime/runtime";
import React, { useState } from "react";
import { login, logout } from "./utils";
import "./global.css";
import getConfig from "./config";
// import { NFTStorage, File } from "nft.storage";
import axios from "axios";
import { nanoid } from "nanoid";

const { networkId } = getConfig(process.env.NODE_ENV || "development");

const nftStorageToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDlEMTQ1Q0EwZmYyODE3ZTJlMzBFN0JhRWU3OTNhYjIyODA3OWREQmUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYzNzYyODU5NDE0OCwibmFtZSI6Im5lYXJ2ZW1iZXIifQ.sVapf7ZTEvvzb2YGM-Ber-4bspT9E--pfjtATcB3dBQ";

const getImageBlob = async (imageInput) => {
  return new Promise((res, rej) => {
    try {
      const fileReader = new FileReader();
      fileReader.onloadend = () => res(fileReader.result);
      fileReader.readAsArrayBuffer(imageInput.files[0]);
    } catch (e) {
      res(null);
    }
  });
};

const Login = () => {
  return (
    <main>
      <h1>Welcome to NEAR!</h1>
      <p>
        This is{" "}
        <a
          href="https://twitter.com/hashtag/NEARvember"
          target="_blank"
          style={{
            backgroundColor: "white",
            borderRadius: "5px",
            padding: "1px 5px",
          }}
        >
          #NEARvember
        </a>{" "}
        Challange 5.
      </p>
      <p>In this app you can create your own image-based NFT!</p>
      <p>
        To make use of the NEAR blockchain, you need to sign in. The button
        below will sign you in using NEAR Wallet.
      </p>
      <p style={{ textAlign: "center", marginTop: "2.5em" }}>
        <button onClick={login}>Sign in</button>
      </p>
    </main>
  );
};

const App = () => {
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    const { titleInput, imageInput } = e.target.elements;

    const title = titleInput.value.trim();
    const image = await getImageBlob(imageInput);
    if (!title || !image) {
      setError("Title and Image should be provided!");
      return;
    } else {
      setError(null);
    }

    const rep = await axios.post("https://api.nft.storage/upload", image, {
      headers: { Authorization: `Bearer ${nftStorageToken}` },
    });

    if (rep.data.ok !== true) {
      console.error(rep.data);
      return;
    }

    const media = `https://${rep.data.value.cid}.ipfs.dweb.link/`;

    window.contract
      .nft_mint(
        {
          receiver_id: window.accountId,
          token_id: nanoid(),
          token_metadata: { title, media, copies: 1 },
        },
        "100000000000000",
        "10000000000000000000000"
      )
      .then((res) => {
        console.log(res);
        setNotification(true);
      });
  };

  if (!window.walletConnection.isSignedIn()) return <Login />;

  return (
    <div>
      {notification && <Notification />}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "end",
        }}
      >
        Hi,&nbsp;
        <span style={{ fontWeight: "bold" }}>{window.accountId}</span>!
        <button className="link" onClick={logout}>
          Sign out
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <form onSubmit={onSubmit}>
          <h1>Create your NFT!</h1>
          {error && (
            <p
              style={{
                backgroundColor: "rgba(255, 0, 0, 0.3)",
                textAlign: "center",
                padding: "10px",
                borderRadius: "10px",
              }}
            >
              {error}
            </p>
          )}
          <table>
            <tbody>
              <tr>
                <td>
                  <label htmlFor="titleInput" style={{ marginRight: "10px" }}>
                    NFT Title:
                  </label>
                </td>
                <td>
                  <input type="text" id="titleInput" placeholder="" />
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="imageInput" style={{ marginRight: "10px" }}>
                    Select an image:
                  </label>
                </td>
                <td>
                  <input type="file" id="imageInput" />
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <button type="submit">Mint NFT</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;

function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`;
  return (
    <aside>
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.accountId}`}
      >
        {window.accountId}
      </a>
      &nbsp;minted NFT in contract:&nbsp;
      <a
        target="_blank"
        rel="noreferrer"
        href={`${urlPrefix}/${window.contract.contractId}`}
      >
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  );
}
