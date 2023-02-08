# Flutter Parking App

## **Deployment**
```bash
run firebase deploy --only functions
```
## **Test in the cloud:**
```bash
gcloud pubsub topics publish  --message 'MyMessage'
```

```bash
curl -X POST -H "Content-Type:application/json" -H "X-MyHeader: 123" "https://us-central1-screener-9631e.cloudfunctions.net/index_list2?list=ec_europa_eu__sanctions_list" -d '[{"field":"nameAlias", "type":"array","subField":"wholeName"}]'
```

```bash
curl -X POST -H "Content-Type:application/json" -H "X-MyHeader: 123" "https://us-central1-screener-9631e.cloudfunctions.net/screen?target=test"
```

```bash
curl -X POST -H "Content-Type:application/json" -H "X-MyHeader: 123" "https://us-central1-screener-9631e.cloudfunctions.net/test?test_parameter=hello" -d '{"test_json":"Hello World!"}'
```