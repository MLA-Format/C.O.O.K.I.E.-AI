import google.generativeai as genai

# This function creates and returns a google generative AI client.
def getClient() -> genai.Client:
    return genai