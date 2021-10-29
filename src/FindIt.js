import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import SearchIcon from "@material-ui/icons/Search";
import ImportExportIcon from "@material-ui/icons/ImportExport";
import {
  Button,
  Row,
  Col,
  Accordion,
  Form,
  Container,
  ListGroup,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { Data } from "./Data";
import { Currency } from "./Currency";
import { PathConfig } from "./PathConfig";
import { Location } from "./Location";
import { V6Api } from "./V6Api";
import "./FindIt.css";

export default function FindIt() {
  const [state, setState] = useState({});

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const params = window.location.href.split("?")[1].split("&");

  var searchParams = {};
  for (var x in params) {
    searchParams[params[x].split("=")[0]] = params[x].split("=")[1];
  }

  const getToken = () => {
    const data = {
      clientId: sessionStorage.clientId,
    };
    Data.post(
      PathConfig.AUTH_PATH + "/oauth/getToken",
      data,
      (err, results) => {
        if (err) {
          console.log("err---------------------", err);
        } else {
          if (results && results.data && results.data.data) {
            sessionStorage.setItem(
              "token",
              "bearer " + results.data.data.token
            );
          }
        }
      }
    );
  };

  if (searchParams.sessionId && searchParams.clientId) {
    sessionStorage.setItem("sessionId", searchParams.sessionId);
    sessionStorage.setItem("clientId", searchParams.clientId);
    sessionStorage.setItem("permission", searchParams.permission);
    getToken();
    Location.getHierarchyLocation();
  }

  if (state.store) {
    if (searchParams.store !== state.store) {
      setState(() => ({
        store: searchParams.store,
      }));
    }
  } else {
    setState(() => ({
      store: searchParams.store,
    }));
  }

  const parentLocation = Location.getParentLocation(searchParams.store);
  const siblingStore = Location.getSiblingStore(searchParams.store);
  const childLocation = searchParams.store;
  const skuTyped = (event) => {
    if (event.target.value) {
      var url = PathConfig.API_PATH + "/v6/json/productSearch";
      var params = {
        searchString: event.target.value,
        bookmark: "",
        limit: 20,
        locations: parentLocation,
        sessionId: sessionStorage.sessionId,
        language: "default",
      };
      Data.get(url, params, (err, results) => {
        var searchSku = [];
        var skuArr = [];
        if (err) {
          console.log("err---------------", err);
        } else {
          results.data.result.rows.forEach((skus) => {
            searchSku.push(skus);
          });
          if (searchSku && searchSku.length) {
            searchSku.forEach((sku) => {
              var skuObj = {
                skuId: sku.id,
                skuDesc: sku.Desc,
                skuName: sku.Name,
                skuBarcode: sku.ProductSkus.Sku[0].Barcodes.type[0].value,
                skuImage: sku.MainImageId ? sku.MainImageId : "",
              };
              skuArr.push(skuObj);
            });
            setState((prevProps) => ({
              ...prevProps,
              skus: skuArr.slice(0, 5),
            }));
          }
        }
      });
    } else {
      setState((prevProps) => ({
        ...prevProps,
        skus: "",
      }));
    }
  };

  const requestHandler = () => {
    window.top.postMessage(
      {
        skuId: state.skuId,
        fromStore: state.fromStore,
        toStore: state.store,
        skuName: state.skuName,
        skuQty: state.skuQty,
      },
      "http://localhost:9999/#/ovc/stocklookup/findit"
    );
    setShow(false);
  };

  const fromStoreHanlder = (event) => {
    setState((prevProps) => ({
      ...prevProps,
      fromStore: event.target.value,
    }));
  };

  const skuQtyHandler = (event) => {
    setState((prevProps) => ({
      ...prevProps,
      skuQty: event.target.value,
    }));
  };

  async function skuSelected(skuDetails) {
    var skuPrice = "";
    var skuCurrencyId = "";
    var url = PathConfig.API_PATH + "/v6price/json/priceSearch";
    var data = {
      locations: ["mb-all"],
      skus: [skuDetails.skuId],
      limit: 200,
    };
    Data.post(url, data, (err, results) => {
      if (err) {
        console.log("err---------------", err);
      } else {
        console.log("results--------------", results);
        var res =
          results &&
          results.data &&
          results.data.result &&
          results.data.result.rows;
        res.forEach((priceDetails) => {
          if (priceDetails.priceType === "3") {
            skuPrice = priceDetails.Amount;
            skuCurrencyId = priceDetails.CurrencyId;
          } else {
            if (!skuPrice) {
              if (priceDetails.priceType === "1") {
                skuPrice = priceDetails.Amount;
                skuCurrencyId = priceDetails.CurrencyId;
              } else {
                skuPrice = priceDetails.Amount;
                skuCurrencyId = priceDetails.CurrencyId;
              }
            }
          }
        });
        url = PathConfig.API_PATH + "/inventories";
        var params = {
          locationid: searchParams.store,
          sku: skuDetails.skuId,
          childLoc: childLocation,
        };
        Data.get(url, params, (err, results) => {
          if (err) {
            console.log("err---------------", err);
          } else {
            console.log("results-------------------", results);
            setState((prevProps) => ({
              ...prevProps,
              skuId: skuDetails.skuId,
              skuName: skuDetails.skuName,
              skuDesc: skuDetails.skuDesc,
              skuImage: skuDetails.skuImage,
              skuPrice: skuPrice,
              skuCurrencyId: skuCurrencyId,
              skuOH: results.data[0].oh,
              skuATP: results.data[0].atp,
              skus: "",
            }));
          }
        });
      }
    });
    if (Object.keys(siblingStore).length) {
      const params = {
        locationid: Object.keys(siblingStore).toString(),
        sku: skuDetails.skuId,
        childLoc: Object.keys(siblingStore).toString(),
      };
      const skuInventories = await V6Api.getInventories(params);
      if (skuInventories.length) {
        let siblingInventory = {};
        skuInventories.forEach((sku) => {
          if (sku.storevalue.length) {
            sku.storevalue.forEach((storevalue) => {
              siblingInventory[storevalue.locationid] = storevalue;
            });
            setState((prevProps) => ({
              ...prevProps,
              siblingInventory: siblingInventory,
              siblingStore: siblingStore,
            }));
          }
        });
      }
    }
  }
  return (
    <React.Fragment>
      <Container fluid>
        <Row className="Row">
          <Col xs={12}>
            <Form.Label className="FindIt">Find It</Form.Label>
          </Col>
        </Row>
        <Row className="Row">
          <Col xs={12}>
            <InputGroup>
              <InputGroup.Text style={{ backgroundColor: "white" }}>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search by SKU, barcode or name"
                onChange={skuTyped}
              />
            </InputGroup>
            {state.skus && state.skus.length && (
              <ListGroup>
                {state.skus.map((sku, i) => {
                  return (
                    <ListGroup.Item
                      key={sku + i}
                      onClick={() => skuSelected(sku)}
                    >
                      {sku.skuId + "~" + sku.skuName + "~" + sku.skuBarcode}
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}
          </Col>
        </Row>
        {state.skuId && (
          <div>
            <Row className="Row">
              <Col xs={6}>
                <Row>
                  <Col xs={2}>
                    {state.skuImage && (
                      <img
                        className="SkuImage"
                        src={state.skuImage}
                        alt="No Image"
                      ></img>
                    )}
                  </Col>
                  <Col xs={10}>
                    <Row>
                      <Form.Label className="SkuId">
                        {state.skuId}
                        {state.skuOH ? (
                          <Button
                            style={{
                              marginLeft: "8px",
                              borderRadius: "20px",
                              fontFamily: "Roboto",
                              fontStyle: "normal",
                              fontWeight: "normal",
                              fontSize: "13px",
                              lineHeight: "24px",
                              textTransform: "none",
                            }}
                            size="small"
                            variant="outline-success"
                          >
                            {state.skuOH + " in Stock"}
                          </Button>
                        ) : (
                          <Button
                            style={{
                              marginLeft: "8px",
                              borderRadius: "20px",
                              fontFamily: "Roboto",
                              fontStyle: "normal",
                              fontWeight: "normal",
                              fontSize: "13px",
                              lineHeight: "24px",
                              textTransform: "none",
                            }}
                            size="small"
                            variant="outline-danger"
                          >
                            Out of Stock
                          </Button>
                        )}

                        {state.skuATP && (
                          <Button
                            className="Atp"
                            style={{
                              marginLeft: "8px",
                              borderRadius: "20px",
                              fontFamily: "Roboto",
                              fontStyle: "normal",
                              fontWeight: "normal",
                              fontSize: "13px",
                              lineHeight: "24px",
                              textTransform: "none",
                              color: "#9C27B0",
                              borderColor: "#9C27B0",
                            }}
                            variant="outline-primary"
                          >
                            {state.skuATP + " Arriving Soon"}
                          </Button>
                        )}
                      </Form.Label>
                    </Row>
                    <Row>
                      <Form.Label className="skuName">
                        {state.skuName}
                      </Form.Label>
                    </Row>
                    <Row>
                      <Form.Label className="SkuPrice">
                        {Currency[state.skuCurrencyId] + state.skuPrice}
                      </Form.Label>
                    </Row>
                  </Col>
                </Row>
              </Col>
              <Col xs={6}>
                <Row>
                  <Form.Label className="Description">DESCRIPTION</Form.Label>
                </Row>
                <Row>
                  <Form.Label className="SkuDescription">
                    {state.skuDesc}
                  </Form.Label>
                </Row>
              </Col>
            </Row>
            <Accordion>
              <Accordion.Header>
                <Form.Label>
                  <ImportExportIcon />
                  Transfers
                </Form.Label>
              </Accordion.Header>
              <Accordion.Body>
                <Row>
                  <Col xs={12}>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Search locations by name"
                            onChange={skuTyped}
                        />
                        <InputGroup.Text style={{ backgroundColor: "white" }}>
                            <FontAwesomeIcon icon={faSearch} />
                        </InputGroup.Text>
                    </InputGroup>
                  </Col>
                </Row>
                <Row>
                  {state.siblingStore &&
                    Object.keys(state.siblingStore).length && (
                      <div style={{ marginTop: "15px" }}>
                        <Form>
                          {Object.keys(state.siblingInventory).map(function (
                            store,
                            index
                          ) {
                            return (
                              <Row className="Row">
                                <Col xs={3}>
                                  <Form.Check
                                    disabled={
                                      state.siblingInventory[store].oh
                                        ? ""
                                        : "true"
                                    }
                                    type="radio"
                                    key={index}
                                    name="radio"
                                    id="default-radio"
                                    label={state.siblingStore[store]}
                                    value={store}
                                    onChange={(e) => fromStoreHanlder(e)}
                                  />
                                </Col>
                                <Col xs={3}>
                                  {state.siblingInventory[store].oh ? (
                                    <Button
                                      style={{
                                        marginLeft: "8px",
                                        borderRadius: "20px",
                                        fontFamily: "Roboto",
                                        fontStyle: "normal",
                                        fontWeight: "normal",
                                        fontSize: "13px",
                                        lineHeight: "24px",
                                        textTransform: "none",
                                      }}
                                      variant="outline-success"
                                    >
                                      {state.siblingInventory[store].oh +
                                        " in Stock"}
                                    </Button>
                                  ) : (
                                    <Button
                                      style={{
                                        marginLeft: "8px",
                                        borderRadius: "20px",
                                        fontFamily: "Roboto",
                                        fontStyle: "normal",
                                        fontWeight: "normal",
                                        fontSize: "13px",
                                        lineHeight: "24px",
                                        textTransform: "none",
                                      }}
                                      variant="outline-danger"
                                    >
                                      Out of Stock
                                    </Button>
                                  )}
                                </Col>
                              </Row>
                            );
                          })}
                        </Form>
                      </div>
                    )}
                </Row>
                <Row>
                  <Col xs={12}>
                    <Button
                      className="RequestTransfer"
                      variant="outline-primary"
                      disabled={
                        sessionStorage.permission == 1 && state.fromStore
                          ? ""
                          : true
                      }
                      onClick={handleShow}
                    >
                      Request Transfer
                    </Button>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion>
          </div>
        )}
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Please select the SKU quantity</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Control type="text" onChange={skuQtyHandler} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={requestHandler}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </React.Fragment>
  );
}
